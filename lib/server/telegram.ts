import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { deleteStoredJson, readStoredJson, writeStoredJson } from "@/lib/server/data-store";
import { prepareSubscriptionCancellation } from "@/lib/server/subscription-cancel";
import { markRealGmailSubscriptionCancelled, readRealGmailSubscriptions } from "@/lib/server/subcut-gmail";
import { storagePath } from "@/lib/server/storage-root";
import type { Subscription } from "@/lib/subcut-automation";

type TelegramChat = {
  chat_id: number;
  username?: string;
  first_name?: string;
  linked_at: string;
  notifications_enabled: boolean;
};

type TelegramUpdate = {
  message?: {
    text?: string;
    chat: { id: number; username?: string; first_name?: string };
    from?: { username?: string; first_name?: string };
  };
  callback_query?: {
    id: string;
    data?: string;
    message?: { chat: { id: number } };
  };
};

type TelegramLink = {
  user_id: string;
  created_at: string;
  expires_at: number;
};

const telegramRootPath = storagePath("telegram");
const usersRootPath = storagePath("users");
const telegramStartPayloadPattern = /^[A-Za-z0-9_-]{16,64}$/;

function botToken() {
  return process.env.TELEGRAM_BOT_TOKEN || "";
}

function botUsername() {
  return (process.env.TELEGRAM_BOT_USERNAME || "TengeGuardBot").replace(/^@/, "");
}

function linkSecret() {
  return process.env.TELEGRAM_LINK_SECRET || process.env.TELEGRAM_BOT_TOKEN || "tengeguard-local-telegram-link-secret";
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function telegramUserPath(userId: string) {
  return path.join(usersRootPath, userId, "telegram.json");
}

function telegramChatPath(chatId: number) {
  return path.join(telegramRootPath, "chats", `${chatId}.json`);
}

function telegramLinkPath(token: string) {
  return path.join(telegramRootPath, "links", `${token}.json`);
}

function telegramReminderLogPath(userId: string) {
  return path.join(usersRootPath, userId, "telegram-reminders.json");
}

function telegramProfilePhotoStatePath() {
  return path.join(telegramRootPath, "profile-photo.json");
}

function telegramUsersIndexPath() {
  return path.join(telegramRootPath, "connected-users.json");
}

function telegramProfilePhotoPath() {
  return path.join(process.cwd(), "public", "telegram-avatar.jpg");
}

async function writeJson(filePath: string, data: unknown) {
  await writeStoredJson(filePath, data);
}

function signPayload(value: string) {
  return crypto.createHmac("sha256", linkSecret()).update(value).digest("base64url");
}

export async function createTelegramConnectUrl(userId: string) {
  const expiresAt = Date.now() + 15 * 60 * 1000;
  const token = crypto.randomBytes(18).toString("base64url");
  await writeJson(telegramLinkPath(token), {
    user_id: userId,
    created_at: new Date().toISOString(),
    expires_at: expiresAt
  } satisfies TelegramLink);

  return `https://t.me/${botUsername()}?start=${token}`;
}

function verifySignedTelegramPayload(payload: string) {
  const parts = payload.split(".");
  if (parts.length !== 3) return null;

  const [userId, expiresAtRaw, signature] = parts;
  const signedValue = `${userId}.${expiresAtRaw}`;
  const expected = signPayload(signedValue);
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;
  return userId;
}

async function verifyTelegramPayload(payload: string) {
  if (!telegramStartPayloadPattern.test(payload)) {
    return verifySignedTelegramPayload(payload);
  }

  try {
    const link = await readStoredJson<TelegramLink>(telegramLinkPath(payload));
    await deleteStoredJson(telegramLinkPath(payload));
    if (!link) return null;
    if (!link.user_id || !Number.isFinite(link.expires_at) || link.expires_at < Date.now()) return null;
    return link.user_id;
  } catch {
    return null;
  }
}

export async function readTelegramChat(userId?: string): Promise<TelegramChat | null> {
  if (!userId) return null;
  return readStoredJson<TelegramChat>(telegramUserPath(userId));
}

async function readChatOwner(chatId: number) {
  const data = await readStoredJson<{ user_id: string }>(telegramChatPath(chatId));
  return data?.user_id || null;
}

async function saveTelegramChat(userId: string, chat: TelegramChat) {
  await writeJson(telegramUserPath(userId), chat);
  await writeJson(telegramChatPath(chat.chat_id), { user_id: userId, ...chat });
  const index = (await readStoredJson<{ userIds: string[] }>(telegramUsersIndexPath())) || { userIds: [] };
  if (!index.userIds.includes(userId)) {
    index.userIds.push(userId);
    await writeJson(telegramUsersIndexPath(), index);
  }
}

export async function getTelegramStatus(userId?: string) {
  const chat = await readTelegramChat(userId);
  const configured = Boolean(botToken() && botUsername() && process.env.TELEGRAM_WEBHOOK_SECRET);

  return {
    ok: true,
    configured,
    botName: "TengeGuard",
    botUsername: botUsername(),
    connected: Boolean(chat?.chat_id),
    notificationsEnabled: Boolean(chat?.notifications_enabled),
    connectUrl: userId && configured ? `${appUrl()}/api/telegram/connect` : null,
    chat: chat
      ? {
          username: chat.username,
          first_name: chat.first_name,
          linked_at: chat.linked_at
        }
      : null
  };
}

async function telegramApi<T>(method: string, body: unknown) {
  const token = botToken();
  if (!token) throw new Error("Telegram bot token is not configured");

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Telegram API failed: ${response.status}${text ? ` ${text.slice(0, 240)}` : ""}`);
  }

  return (await response.json()) as T;
}

async function telegramApiMultipart<T>(method: string, body: FormData) {
  const token = botToken();
  if (!token) throw new Error("Telegram bot token is not configured");

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    body
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Telegram API failed: ${response.status}${text ? ` ${text.slice(0, 240)}` : ""}`);
  }

  return (await response.json()) as T;
}

function formatMoney(subscription: Subscription) {
  const cycles = { monthly: "месяц", yearly: "год", weekly: "неделю", unknown: "период" };
  return `${subscription.cost.toLocaleString("ru-RU")} ${subscription.currency} / ${cycles[subscription.billing_cycle]}`;
}

function endDate(subscription: Subscription) {
  return subscription.trial_ends_at || subscription.next_billing_date;
}

function daysUntil(value: string | null | undefined) {
  if (!value) return null;
  const today = new Date(new Date().toISOString().slice(0, 10)).getTime();
  const target = new Date(value).getTime();
  if (!Number.isFinite(target)) return null;
  return Math.round((target - today) / 86400000);
}

function reminderReason(subscription: Subscription) {
  const date = endDate(subscription);
  const diff = daysUntil(date);
  if (diff === null) return "дата следующего списания не определена";
  if (diff < 0) return `дата уже прошла: ${date}`;
  if (diff === 0) return `сегодня, ${date}`;
  if (diff === 1) return `завтра, ${date}`;
  return `через ${diff} дн., ${date}`;
}

function subscriptionMessage(subscription: Subscription) {
  const evidence = subscription.evidence[0];
  const date = endDate(subscription);
  return [
    `TengeGuard · ${subscription.provider_name}`,
    "",
    `Сумма: ${formatMoney(subscription)}`,
    `Следующее списание: ${reminderReason(subscription)}`,
    `Точность определения: ${Math.round(subscription.confidence * 100)}%`,
    evidence?.subject ? `Банковская операция: ${evidence.subject}` : "Источник: история банковских операций",
    evidence?.date ? `Дата операции: ${evidence.date}` : null,
    !date ? "Точная дата не определена, поэтому автоматическое напоминание не запланировано." : null,
    "",
    "Что сделать с подпиской?"
  ]
    .filter(Boolean)
    .join("\n");
}

function reminderKeyboard(subscription: Subscription) {
  return {
    inline_keyboard: [
      [
        { text: "Отменить подписку", callback_data: `cancel:${subscription.id}` },
        { text: "Оставить активной", callback_data: `renew:${subscription.id}` }
      ],
      [{ text: "Открыть TengeGuard", url: `${appUrl()}/dashboard/subscriptions` }]
    ]
  };
}

export async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: unknown) {
  return telegramApi("sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {})
  });
}

export async function sendSubscriptionReminder(chatId: number, subscription: Subscription) {
  return telegramApi("sendMessage", {
    chat_id: chatId,
    text: subscriptionMessage(subscription),
    disable_web_page_preview: true,
    reply_markup: reminderKeyboard(subscription)
  });
}

export async function sendDueTelegramReminders(userId: string, daysAhead = 3) {
  const chat = await readTelegramChat(userId);
  if (!chat?.chat_id || !chat.notifications_enabled) return { sent: 0, skipped: "telegram_not_connected" };

  const subscriptions = (await readRealGmailSubscriptions(userId)).filter((subscription) => subscription.status !== "cancelled");
  const reminderLog = await readTelegramReminderLog(userId);
  const today = new Date().toISOString().slice(0, 10);
  const due = subscriptions.filter((subscription) => {
    const diff = daysUntil(endDate(subscription));
    const exactReminderDay = diff === 7 || diff === 1 || diff === 0 || diff === daysAhead;
    if (diff === null || diff < 0 || !exactReminderDay) return false;
    return !reminderLog.sent[reminderKey(subscription, today)];
  });

  for (const subscription of due) {
    await sendSubscriptionReminder(chat.chat_id, subscription);
    reminderLog.sent[reminderKey(subscription, today)] = new Date().toISOString();
  }

  if (due.length) await writeTelegramReminderLog(userId, reminderLog);
  return { sent: due.length };
}

export async function sendDueTelegramRemindersForAll(daysAhead = 3) {
  const index = await readStoredJson<{ userIds: string[] }>(telegramUsersIndexPath());
  const userIds = index?.userIds || [];

  let sent = 0;
  for (const userId of userIds) {
    try {
      const result = await sendDueTelegramReminders(userId, daysAhead);
      sent += "sent" in result ? result.sent : 0;
    } catch {
      // A blocked chat must not stop reminders for every other connected user.
    }
  }

  return { users: userIds.length, sent };
}

async function answerCallbackQuery(callbackQueryId: string, text: string) {
  return telegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false
  });
}

async function sendSubscriptionList(chatId: number, userId: string) {
  const subscriptions = (await readRealGmailSubscriptions(userId)).filter((subscription) => subscription.status !== "cancelled");
  if (!subscriptions.length) {
    await sendTelegramMessage(
      chatId,
      "Активные подписки пока не найдены. TengeGuard показывает только списания, подтверждённые банковской историей.",
      { inline_keyboard: [[{ text: "Открыть TengeGuard", url: `${appUrl()}/dashboard/subscriptions` }]] }
    );
    return;
  }

  const visible = subscriptions.slice(0, 15);
  await sendTelegramMessage(chatId, `Найдено активных подписок: ${subscriptions.length}. Ниже можно управлять каждой отдельно.`);
  for (const subscription of visible) {
    await sendSubscriptionReminder(chatId, subscription);
  }
  if (subscriptions.length > visible.length) {
    await sendTelegramMessage(
      chatId,
      `Показаны первые ${visible.length}. Остальные доступны на сайте.`,
      { inline_keyboard: [[{ text: "Все подписки", url: `${appUrl()}/dashboard/subscriptions` }]] }
    );
  }
}

async function sendBotHelp(chatId: number) {
  await sendTelegramMessage(
    chatId,
    [
      "TengeGuard управляет уведомлениями о подтверждённых платных подписках.",
      "",
      "/subscriptions — показать активные подписки",
      "/status — проверить подключение",
      "/notifications — настроить напоминания",
      "/help — показать эту справку"
    ].join("\n"),
    { inline_keyboard: [[{ text: "Открыть TengeGuard", url: `${appUrl()}/dashboard` }]] }
  );
}

async function callbackOwner(callback: NonNullable<TelegramUpdate["callback_query"]>) {
  const chatId = callback.message?.chat.id;
  if (!chatId) return null;
  const userId = await readChatOwner(chatId);
  return userId ? { chatId, userId } : null;
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const message = update.message;
  const command = message?.text?.trim().split(/\s+/)[0]?.split("@")[0]?.toLowerCase();

  if (message && command === "/start") {
    const payload = message.text?.split(/\s+/)[1];
    const userId = payload ? await verifyTelegramPayload(payload) : null;

    if (!userId) {
      const existingUserId = await readChatOwner(message.chat.id);
      if (existingUserId) {
        await sendBotHelp(message.chat.id);
        return { ok: true, linked: true, userId: existingUserId };
      }
      await sendTelegramMessage(message.chat.id, "Откройте TengeGuard и нажмите «Подключить Telegram» ещё раз, чтобы привязать этот чат.");
      return { ok: true, linked: false };
    }

    await saveTelegramChat(userId, {
      chat_id: message.chat.id,
      username: message.from?.username || message.chat.username,
      first_name: message.from?.first_name || message.chat.first_name,
      linked_at: new Date().toISOString(),
      notifications_enabled: true
    });

    const subscriptions = (await readRealGmailSubscriptions(userId)).filter((subscription) => subscription.status !== "cancelled");
    await sendTelegramMessage(
      message.chat.id,
      [
        "TengeGuard подключён.",
        "",
        "Бот будет предупреждать за 7 дней и за 1 день до прогнозируемого банковского списания.",
        `Сейчас найдено подписок: ${subscriptions.length}.`,
        "",
        "Команды: /subscriptions, /status, /notifications, /help"
      ].join("\n"),
      {
        inline_keyboard: [[{ text: "Открыть TengeGuard", url: `${appUrl()}/dashboard` }]]
      }
    );

    return { ok: true, linked: true, userId };
  }

  if (message && command === "/subscriptions") {
    const userId = await readChatOwner(message.chat.id);
    if (!userId) {
      await sendTelegramMessage(message.chat.id, "Этот Telegram-чат ещё не подключён. Подключите его на сайте TengeGuard.");
      return { ok: true, linked: false };
    }
    await sendSubscriptionList(message.chat.id, userId);
    return { ok: true, action: "subscriptions" };
  }

  if (message && command === "/status") {
    const userId = await readChatOwner(message.chat.id);
    if (!userId) {
      await sendTelegramMessage(message.chat.id, "Telegram ещё не подключён к TengeGuard.");
      return { ok: true, linked: false };
    }
    const subscriptions = (await readRealGmailSubscriptions(userId)).filter((subscription) => subscription.status !== "cancelled");
    await sendTelegramMessage(message.chat.id, `Telegram подключён. Активных найденных подписок: ${subscriptions.length}. Напоминания включены.`);
    return { ok: true, action: "status" };
  }

  if (message && command === "/notifications") {
    const userId = await readChatOwner(message.chat.id);
    if (!userId) {
      await sendTelegramMessage(message.chat.id, "Сначала подключите Telegram на сайте TengeGuard.");
      return { ok: true, linked: false };
    }
    const chat = await readTelegramChat(userId);
    await sendTelegramMessage(message.chat.id, `Напоминания сейчас ${chat?.notifications_enabled ? "включены" : "выключены"}.`, {
      inline_keyboard: [[
        { text: "Включить", callback_data: "notifications:on" },
        { text: "Выключить", callback_data: "notifications:off" }
      ]]
    });
    return { ok: true, action: "notifications" };
  }

  if (message && command === "/help") {
    await sendBotHelp(message.chat.id);
    return { ok: true, action: "help" };
  }

  const callback = update.callback_query;
  if (callback?.id && callback.data) {
    const owner = await callbackOwner(callback);
    if (!owner) {
      await answerCallbackQuery(callback.id, "Сначала подключите бота на сайте TengeGuard.");
      return { ok: true, linked: false };
    }

    if (callback.data === "notifications:on" || callback.data === "notifications:off") {
      const chat = await readTelegramChat(owner.userId);
      if (chat) await saveTelegramChat(owner.userId, { ...chat, notifications_enabled: callback.data.endsWith(":on") });
      await answerCallbackQuery(callback.id, callback.data.endsWith(":on") ? "Напоминания включены." : "Напоминания выключены.");
      return { ok: true, action: callback.data };
    }

    if (callback.data.startsWith("renew:")) {
      await answerCallbackQuery(callback.id, "Ок, оставляем подписку активной.");
      return { ok: true, action: "renew" };
    }

    if (callback.data.startsWith("cancel:")) {
      const subscriptionId = callback.data.slice("cancel:".length);
      const subscription = (await readRealGmailSubscriptions(owner.userId)).find((item) => item.id === subscriptionId && item.status !== "cancelled");
      if (!subscription) {
        await answerCallbackQuery(callback.id, "Подписка не найдена или уже отменена.");
        return { ok: true, action: "cancel_missing" };
      }
      await answerCallbackQuery(callback.id, "Проверьте и подтвердите действие.");
      await sendTelegramMessage(owner.chatId, `Хотите отменить подписку ${subscription.provider_name}?`, {
        inline_keyboard: [[
          { text: "Да, продолжить", callback_data: `cancel_confirm:${subscription.id}` },
          { text: "Нет", callback_data: `renew:${subscription.id}` }
        ]]
      });
      return { ok: true, action: "cancel_confirmation" };
    }

    if (callback.data.startsWith("cancel_confirm:")) {
      const subscriptionId = callback.data.slice("cancel_confirm:".length);
      const subscription = (await readRealGmailSubscriptions(owner.userId)).find((item) => item.id === subscriptionId && item.status !== "cancelled");
      if (!subscription) {
        await answerCallbackQuery(callback.id, "Подписка не найдена или уже отменена.");
        return { ok: true, action: "cancel_missing" };
      }

      const cancellation = prepareSubscriptionCancellation(subscription);
      await answerCallbackQuery(callback.id, "Открываю безопасный путь отмены.");
      if (cancellation.status !== "needs_user_action" || !/^https:\/\//.test(cancellation.cancellation_path)) {
        await sendTelegramMessage(owner.chatId, "Для этой подписки не найден подтверждённый официальный канал отмены. Проверьте её на сайте TengeGuard.", {
          inline_keyboard: [[{ text: "Открыть подписки", url: `${appUrl()}/dashboard/subscriptions` }]]
        });
        return { ok: true, action: "cancel_unsupported" };
      }

      await sendTelegramMessage(
        owner.chatId,
        `Для отмены ${subscription.provider_name} сервис должен подтвердить вашу сессию или 2FA. После завершения вернитесь и нажмите «Я отменил».`,
        {
          inline_keyboard: [
            [{ text: "Перейти к отмене", url: cancellation.cancellation_path }],
            [{ text: "Я отменил", callback_data: `cancelled:${subscription.id}` }]
          ]
        }
      );
      return { ok: true, action: "cancel_opened" };
    }

    if (callback.data.startsWith("cancelled:")) {
      const subscriptionId = callback.data.slice("cancelled:".length);
      const subscription = await markRealGmailSubscriptionCancelled(owner.userId, subscriptionId);
      if (!subscription) {
        await answerCallbackQuery(callback.id, "Подписка не найдена.");
        return { ok: true, action: "cancel_missing" };
      }
      await answerCallbackQuery(callback.id, "Подписка отмечена отменённой.");
      await sendTelegramMessage(owner.chatId, `${subscription.provider_name} перенесена в историю отменённых подписок.`);
      return { ok: true, action: "cancelled" };
    }
  }

  return { ok: true };
}

export async function sendTelegramDigest(userId: string) {
  const chat = await readTelegramChat(userId);
  if (!chat?.chat_id) return { sent: false, reason: "telegram_not_connected" };
  await sendSubscriptionList(chat.chat_id, userId);
  const subscriptions = (await readRealGmailSubscriptions(userId)).filter((subscription) => subscription.status !== "cancelled");
  return { sent: true, count: subscriptions.length };
}

async function ensureTelegramBotProfilePhoto() {
  if (!botToken()) return { ok: false, reason: "telegram_not_configured" };

  let bytes: Buffer;
  try {
    bytes = await readFile(telegramProfilePhotoPath());
  } catch {
    return { ok: false, reason: "profile_photo_missing" };
  }

  const hash = crypto.createHash("sha256").update(bytes).digest("hex");
  const state = await readStoredJson<{ hash?: string }>(telegramProfilePhotoStatePath());
  if (state?.hash === hash) return { ok: true, skipped: true };

  const form = new FormData();
  form.append("photo", JSON.stringify({ type: "static", photo: "attach://profile_photo" }));
  form.append("profile_photo", new Blob([new Uint8Array(bytes)], { type: "image/jpeg" }), "tengeguard.jpg");
  await telegramApiMultipart("setMyProfilePhoto", form);
  await writeJson(telegramProfilePhotoStatePath(), { hash, updated_at: new Date().toISOString() });
  return { ok: true, updated: true };
}

function reminderKey(subscription: Subscription, today: string) {
  return `${subscription.id}:${endDate(subscription) || "no-date"}:${today}`;
}

async function readTelegramReminderLog(userId: string): Promise<{ sent: Record<string, string> }> {
  const parsed = await readStoredJson<{ sent?: Record<string, string> }>(telegramReminderLogPath(userId));
  return { sent: parsed?.sent || {} };
}

async function writeTelegramReminderLog(userId: string, log: { sent: Record<string, string> }) {
  await writeJson(telegramReminderLogPath(userId), log);
}

export async function ensureTelegramBotCommands() {
  if (!botToken()) return { ok: false, reason: "telegram_not_configured" };
  await ensureTelegramBotProfilePhoto().catch(() => null);
  await telegramApi("setMyShortDescription", {
    short_description: "Напоминания о реальных регулярных списаниях."
  });
  await telegramApi("setMyDescription", {
    description:
      "TengeGuard предупреждает о подписках, найденных по банковским операциям. Подключите бота на сайте и используйте /subscriptions или /status."
  });
  await telegramApi("setMyCommands", {
    commands: [
      { command: "status", description: "Статус подключения TengeGuard" },
      { command: "subscriptions", description: "Показать найденные подписки" },
      { command: "notifications", description: "Настроить напоминания" },
      { command: "help", description: "Помощь по командам" }
    ]
  });
  return { ok: true };
}

export async function ensureTelegramWebhook() {
  if (!botToken()) return { ok: false, reason: "telegram_not_configured" };
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return { ok: false, reason: "webhook_secret_not_configured" };

  const webhookUrl = `${appUrl()}/api/telegram/webhook`;
  await telegramApi("setWebhook", {
    url: webhookUrl,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false
  });
  return { ok: true, webhookUrl };
}
