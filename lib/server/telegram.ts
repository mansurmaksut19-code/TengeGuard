import crypto from "node:crypto";
import { mkdir, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { deleteRealGmailSubscription, readRealGmailSubscriptions, readSyncReport, type SessionUser } from "@/lib/server/subcut-gmail";
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

function telegramOffsetPath() {
  return path.join(telegramRootPath, "updates-offset.json");
}

function telegramReminderLogPath(userId: string) {
  return path.join(usersRootPath, userId, "telegram-reminders.json");
}

function telegramProfilePhotoStatePath() {
  return path.join(telegramRootPath, "profile-photo.json");
}

function telegramProfilePhotoPath() {
  return path.join(process.cwd(), "public", "telegram-avatar.jpg");
}

async function writeJson(filePath: string, data: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, JSON.stringify(data, null, 2), "utf8");
  await rename(tempPath, filePath);
}

async function readUpdateOffset() {
  try {
    const data = JSON.parse(await readFile(telegramOffsetPath(), "utf8")) as { offset: number };
    return data.offset;
  } catch {
    return 0;
  }
}

async function writeUpdateOffset(offset: number) {
  await writeJson(telegramOffsetPath(), { offset });
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
    const link = JSON.parse(await readFile(telegramLinkPath(payload), "utf8")) as TelegramLink;
    await unlink(telegramLinkPath(payload)).catch(() => null);
    if (!link.user_id || !Number.isFinite(link.expires_at) || link.expires_at < Date.now()) return null;
    return link.user_id;
  } catch {
    return null;
  }
}

export async function readTelegramChat(userId?: string): Promise<TelegramChat | null> {
  if (!userId) return null;
  try {
    return JSON.parse(await readFile(telegramUserPath(userId), "utf8")) as TelegramChat;
  } catch {
    return null;
  }
}

async function readChatOwner(chatId: number) {
  try {
    const data = JSON.parse(await readFile(telegramChatPath(chatId), "utf8")) as { user_id: string };
    return data.user_id;
  } catch {
    return null;
  }
}

async function saveTelegramChat(userId: string, chat: TelegramChat) {
  await writeJson(telegramUserPath(userId), chat);
  await writeJson(telegramChatPath(chat.chat_id), { user_id: userId, ...chat });
}

export async function getTelegramStatus(userId?: string) {
  const chat = await readTelegramChat(userId);
  const configured = Boolean(botToken() && botUsername());

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

async function telegramGet<T>(method: string, params: Record<string, string | number | boolean> = {}) {
  const token = botToken();
  if (!token) throw new Error("Telegram bot token is not configured");
  const url = new URL(`https://api.telegram.org/bot${token}/${method}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Telegram API failed: ${response.status}${text ? ` ${text.slice(0, 240)}` : ""}`);
  }
  return (await response.json()) as T;
}

function formatMoney(subscription: Subscription) {
  if (subscription.cost <= 0) return subscription.type === "free_trial" ? "trial / временно бесплатно" : "бесплатно";
  return `${subscription.cost} ${subscription.currency}${subscription.billing_cycle !== "unknown" ? ` / ${subscription.billing_cycle}` : ""}`;
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
  if (diff === null) return "дата окончания или списания не найдена";
  if (diff < 0) return `уже закончилось: ${date}`;
  if (diff === 0) return `сегодня: ${date}`;
  if (diff === 1) return `завтра: ${date}`;
  return `осталось ${diff} дн. (${date})`;
}

function subscriptionType(subscription: Subscription) {
  if (subscription.type === "paid") return "платная";
  if (subscription.type === "free") return "бесплатная";
  if (subscription.type === "free_trial") return "trial / временная";
  return "нужно проверить";
}

function subscriptionMessage(subscription: Subscription) {
  const evidence = subscription.evidence[0];
  const date = endDate(subscription);
  return [
    `TengeGuard: ${subscription.provider_name}`,
    "",
    `Тип: ${subscriptionType(subscription)}`,
    `Цена: ${formatMoney(subscription)}`,
    `Срок: ${reminderReason(subscription)}`,
    `Достоверность: ${Math.round(subscription.confidence * 100)}%`,
    evidence?.subject ? `Gmail-доказательство: ${evidence.subject}` : "Доказательство: данные аккаунта",
    evidence?.date ? `Дата письма: ${evidence.date}` : null,
    !date ? "Важно: точная дата окончания в письмах не найдена, уведомление по сроку не ставится." : null,
    "",
    "Отменить или оставить?"
  ]
    .filter(Boolean)
    .join("\n");
}

function reminderKeyboard(subscription: Subscription) {
  return {
    inline_keyboard: [
      [{ text: "Открыть отмену", url: subscription.cancellation_path }],
      [
        { text: "Оставить", callback_data: `keep:${subscription.id}` },
        { text: "Уже отменил", callback_data: `done:${subscription.id}` }
      ],
      [{ text: "Все подписки", url: `${appUrl()}/dashboard/subscriptions` }]
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
    if (diff === null || diff < 0 || diff > daysAhead) return false;
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
  let userIds: string[] = [];

  try {
    const entries = await readdir(usersRootPath, { withFileTypes: true });
    userIds = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return { users: 0, sent: 0 };
  }

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
    const date = endDate(subscription) || "дата не найдена";
    const evidence = subscription.evidence[0];
    const evidenceLabel = evidence?.subject ? `, доказательство: ${evidence.subject}` : "";
    return `- ${subscription.provider_name}: ${formatMoney(subscription)}, срок: ${date}${evidenceLabel}`;
  });

  await sendTelegramMessage(
    chatId,
    [
      "TengeGuard: подтвержденные подписки",
      "",
      lines.length
        ? lines.join("\n")
        : "Подтвержденные подписки пока не найдены. Чтобы не показывать фейк, TengeGuard скрывает слабые Gmail-кандидаты.",
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

    const report = await readSyncReport(userId);
    await sendTelegramMessage(
      message.chat.id,
      [
        "TengeGuard подключён.",
        "",
        "Бот будет присылать уведомления, когда подписка, trial или бесплатный период скоро закончится.",
        report ? `Последний Gmail-скан: ${report.subscriptions_found} подписок, ${report.messages_scanned} писем.` : "Запустите Gmail-скан на сайте, чтобы обновить подписки.",
        "",
        "Команды: /subscriptions, /status"
      ].join("\n"),
      {
        inline_keyboard: [[{ text: "Открыть TengeGuard", url: `${appUrl()}/dashboard/access` }]]
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
    const report = await readSyncReport(userId);
    await sendTelegramMessage(
      message.chat.id,
      report ? `Подключено. Последний скан: ${report.subscriptions_found} подписок, ${report.messages_scanned} писем.` : "Подключено. Сначала запустите сканирование на сайте."
    );
    return { ok: true, action: "status" };
  }

  const callback = update.callback_query;
  if (callback?.id && callback.data) {
    if (callback.data.startsWith("keep:")) {
      await answerCallbackQuery(callback.id, "Ок, оставляем.");
      return { ok: true, action: "keep" };
    }

    if (callback.data.startsWith("done:")) {
      const chatId = callback.message?.chat.id;
      const userId = chatId ? await readChatOwner(chatId) : null;
      const subscriptionId = callback.data.replace("done:", "");
      if (userId) await deleteRealGmailSubscription(userId, subscriptionId);
      await answerCallbackQuery(callback.id, "Отмечено как отменённое и убрано из TengeGuard.");
      return { ok: true, action: "done" };
    }
  }

  return { ok: true };
}

export async function pollTelegramUpdates() {
  if (!botToken()) return { ok: false, reason: "telegram_not_configured" };
  const offset = await readUpdateOffset();
  const response = await telegramGet<{ ok: boolean; result: Array<TelegramUpdate & { update_id: number }> }>("getUpdates", {
    offset,
    timeout: 0,
    limit: 20
  });

  let nextOffset = offset;
  let handled = 0;
  for (const update of response.result || []) {
    nextOffset = Math.max(nextOffset, update.update_id + 1);
    await handleTelegramUpdate(update);
    handled += 1;
  }

  if (nextOffset !== offset) await writeUpdateOffset(nextOffset);
  return { ok: true, handled };
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
  try {
    const state = JSON.parse(await readFile(telegramProfilePhotoStatePath(), "utf8")) as { hash?: string };
    if (state.hash === hash) return { ok: true, skipped: true };
  } catch {
    // no previous photo state
  }

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
  try {
    const parsed = JSON.parse(await readFile(telegramReminderLogPath(userId), "utf8")) as { sent?: Record<string, string> };
    return { sent: parsed.sent || {} };
  } catch {
    return { sent: {} };
  }
}

async function writeTelegramReminderLog(userId: string, log: { sent: Record<string, string> }) {
  await writeJson(telegramReminderLogPath(userId), log);
}

export async function ensureTelegramBotCommands() {
  if (!botToken()) return { ok: false, reason: "telegram_not_configured" };
  await ensureTelegramBotProfilePhoto().catch(() => null);
  await telegramApi("setMyShortDescription", {
    short_description: "Real Gmail-based subscription alerts."
  });
  await telegramApi("setMyDescription", {
    description:
      "TengeGuard sends reminders only for subscriptions, trial plans, and free periods confirmed by Gmail evidence. Connect it from the website and use /subscriptions or /status."
  });
  await telegramApi("setMyCommands", {
    commands: [
      { command: "status", description: "Статус подключения TengeGuard" },
      { command: "subscriptions", description: "Показать найденные подписки" }
    ]
  });
  return { ok: true };
}

export function ensureTelegramReminderSchedulerStarted() {
  const schedulerVersion = 2;
  const state = globalThis as typeof globalThis & {
    __tengeguardTelegramReminderSchedulerStarted?: boolean;
    __tengeguardTelegramSchedulerVersion?: number;
    __tengeguardTelegramPollTimer?: ReturnType<typeof setInterval>;
    __tengeguardTelegramReminderTimer?: ReturnType<typeof setInterval>;
  };

  if (state.__tengeguardTelegramReminderSchedulerStarted && state.__tengeguardTelegramSchedulerVersion === schedulerVersion) return;
  if (!botToken()) return;

  if (state.__tengeguardTelegramPollTimer) clearInterval(state.__tengeguardTelegramPollTimer);
  if (state.__tengeguardTelegramReminderTimer) clearInterval(state.__tengeguardTelegramReminderTimer);

  state.__tengeguardTelegramReminderSchedulerStarted = true;
  state.__tengeguardTelegramSchedulerVersion = schedulerVersion;

  const poll = async () => {
    await pollTelegramUpdates().catch(() => null);
  };

  const sendReminders = async () => {
    await sendDueTelegramRemindersForAll(3).catch(() => null);
  };

  state.__tengeguardTelegramPollTimer = setInterval(poll, 3000);
  state.__tengeguardTelegramReminderTimer = setInterval(sendReminders, 60 * 60 * 1000);
  state.__tengeguardTelegramPollTimer.unref?.();
  state.__tengeguardTelegramReminderTimer.unref?.();
  setTimeout(poll, 1000).unref?.();
  setTimeout(sendReminders, 5000).unref?.();
}
