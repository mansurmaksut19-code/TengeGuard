import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { deleteStoredJson, readStoredJson, writeStoredJson } from "@/lib/server/data-store";
import { readRealGmailSubscriptions } from "@/lib/server/subcut-gmail";
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
  const cancellationUrl = /^https:\/\//.test(subscription.cancellation_path || "")
    ? subscription.cancellation_path
    : `${appUrl()}/dashboard/subscriptions`;
  return {
    inline_keyboard: [
      [
        { text: "Отменить у сервиса", url: cancellationUrl },
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

  const subscriptions = await readRealGmailSubscriptions(userId);
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
    const result = await sendDueTelegramReminders(userId, daysAhead);
    sent += "sent" in result ? result.sent : 0;
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
  const subscriptions = await readRealGmailSubscriptions(userId);
  const lines = subscriptions.map((subscription) => {
    const date = endDate(subscription) || "дата не определена";
    const evidence = subscription.evidence[0];
    const evidenceLabel = evidence?.subject ? `, операция: ${evidence.subject}` : "";
    return `• ${subscription.provider_name}: ${formatMoney(subscription)}, следующее списание: ${date}${evidenceLabel}`;
  });

  await sendTelegramMessage(
    chatId,
    [
      "TengeGuard · найденные подписки",
      "",
      lines.length
        ? lines.join("\n")
        : "Подписки пока не найдены. TengeGuard показывает только списания, подтверждённые банковской историей.",
      "",
      `${appUrl()}/dashboard/subscriptions`
    ].join("\n")
  );
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const message = update.message;

  if (message?.text?.startsWith("/start")) {
    const payload = message.text.split(/\s+/)[1];
    const userId = payload ? await verifyTelegramPayload(payload) : null;

    if (!userId) {
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

    const subscriptions = await readRealGmailSubscriptions(userId);
    await sendTelegramMessage(
      message.chat.id,
      [
        "TengeGuard подключён.",
        "",
        "Бот будет предупреждать за 7 дней и за 1 день до прогнозируемого банковского списания.",
        `Сейчас найдено подписок: ${subscriptions.length}.`,
        "",
        "Команды: /subscriptions, /status"
      ].join("\n"),
      {
        inline_keyboard: [[{ text: "Открыть TengeGuard", url: `${appUrl()}/dashboard` }]]
      }
    );

    return { ok: true, linked: true, userId };
  }

  if (message?.text === "/subscriptions") {
    const userId = await readChatOwner(message.chat.id);
    if (!userId) {
      await sendTelegramMessage(message.chat.id, "Этот Telegram-чат ещё не подключён. Подключите его на сайте TengeGuard.");
      return { ok: true, linked: false };
    }
    await sendSubscriptionList(message.chat.id, userId);
    return { ok: true, action: "subscriptions" };
  }

  if (message?.text === "/status") {
    const userId = await readChatOwner(message.chat.id);
    if (!userId) {
      await sendTelegramMessage(message.chat.id, "Telegram ещё не подключён к TengeGuard.");
      return { ok: true, linked: false };
    }
    const subscriptions = await readRealGmailSubscriptions(userId);
    await sendTelegramMessage(message.chat.id, `Telegram подключён. Активных найденных подписок: ${subscriptions.length}. Напоминания включены.`);
    return { ok: true, action: "status" };
  }

  const callback = update.callback_query;
  if (callback?.id && callback.data) {
    if (callback.data.startsWith("renew:")) {
      await answerCallbackQuery(callback.id, "Ок, оставляем подписку активной.");
      return { ok: true, action: "renew" };
    }
  }

  return { ok: true };
}

export async function sendTelegramDigest(userId: string) {
  const chat = await readTelegramChat(userId);
  if (!chat?.chat_id) return { sent: false, reason: "telegram_not_connected" };
  await sendSubscriptionList(chat.chat_id, userId);
  const subscriptions = await readRealGmailSubscriptions(userId);
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
      { command: "subscriptions", description: "Показать найденные подписки" }
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
