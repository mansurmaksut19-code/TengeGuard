import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { getGoogleOAuthConfig } from "@/lib/server/google-oauth-config";
import { parseEmailReceipts, type Subscription } from "@/lib/subcut-automation";

type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
};

type StoredTokens = {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  email: string;
  name?: string;
  avatar_url?: string;
  scope?: string;
};

type GoogleUserInfo = {
  email?: string;
  name?: string;
  picture?: string;
};

type GmailListResponse = {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
};

type GmailHeader = {
  name: string;
  value: string;
};

type GmailMessage = {
  id: string;
  threadId?: string;
  internalDate?: string;
  payload?: {
    mimeType?: string;
    headers?: GmailHeader[];
    body?: { data?: string };
    parts?: GmailMessage["payload"][];
  };
  snippet?: string;
};

export type SyncReport = {
  ok: boolean;
  scanned_at: string;
  messages_scanned: number;
  subscriptions_found: number;
  query_count: number;
  user_email?: string;
  error?: string;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
};

const rootPath = path.join(process.cwd(), ".tengeguard", "users");
const defaultMaxMessagesPerQuery = 250;
const defaultMaxMessagesPerSync = 3000;
  const gmailFetchBatchSize = readPositiveIntegerEnv("TENGEGUARD_GMAIL_BATCH_SIZE", 10);
const gmailFetchRetryCount = readPositiveIntegerEnv("TENGEGUARD_GMAIL_RETRIES", 4);
const gmailQueries = [
  '(receipt OR invoice OR subscription OR renewal OR renewed OR trial OR "free plan" OR "free account" OR billing OR charged OR paid OR order) newer_than:10y',
  '("Google Play Order Receipt" OR "Apple Receipt" OR "Your receipt from Apple" OR "subscription from Google Commerce" OR "Manage your subscriptions") newer_than:10y',
  '("automatic payment" OR "recurring payment" OR "preapproved payment" OR "billing agreement" OR "subscription payment" OR "merchant of record") newer_than:10y',
  '(receipt OR invoice OR subscription OR renewal OR renewed OR "next billing" OR "billing date" OR membership OR "paid plan") newer_than:5y',
  '("welcome to" OR "your account is ready" OR "you now have access" OR "your free account" OR "your free plan" OR "included in your free plan" OR "account is active" OR "plan is active") newer_than:8y',
  '("free tier" OR "starter plan" OR "basic plan" OR "hobby plan" OR "developer plan" OR "community plan" OR "you are on the free" OR "included in your plan") newer_than:8y',
  '("trial expires" OR "trial has started" OR "trial activated" OR "trial is ending" OR "trial will end" OR "complimentary access" OR "access expires" OR "valid until") newer_than:8y',
  '("next payment" OR "next charge" OR "next billing date" OR "renews on" OR "expires on" OR "ends on" OR "subscription ends" OR "billing period" OR "service period" OR "current period") newer_than:8y',
  '("следующее списание" OR "следующая оплата" OR "следующий платеж" OR "следующий платёж" OR "дата списания" OR "дата продления" OR "подписка заканчивается" OR "пробный период закончится" OR "бесплатно до" OR "действует до") newer_than:8y',
  '("free trial" OR "trial started" OR "trial starts" OR "trial is active" OR "trial ends" OR "trial ending" OR "trial will end" OR "trial period" OR "free until" OR "temporary access" OR "free access" OR "access expires" OR "valid until" OR "пробный период" OR "триал" OR "временно бесплатный" OR "бесплатный доступ") newer_than:5y',
  '("free plan" OR "free account" OR "free subscription" OR "no charge" OR "without charge" OR "бесплатная подписка" OR "бесплатный план" OR "бесплатный тариф" OR "you are subscribed" OR "subscription confirmed" OR "membership active" OR "plan is active" OR "your account is active") newer_than:5y',
  '(subject:receipt OR subject:invoice OR subject:subscription OR subject:renewal OR subject:trial OR subject:чек OR subject:подписка OR subject:жазылым) newer_than:5y',
  '(from:netflix.com OR from:spotify.com OR from:youtube.com OR from:google.com OR from:adobe.com OR from:openai.com OR from:chatgpt.com OR from:yandex OR from:apple.com OR from:microsoft.com OR from:paypal.com OR from:stripe.com) newer_than:5y',
  '(from:canva.com OR from:dropbox.com OR from:notion.so OR from:figma.com OR from:zoom.us OR from:discord.com OR from:duolingo.com OR from:tinder.com OR from:bumble.com) newer_than:5y',
  '(from:linkedin.com OR from:github.com OR from:flowkey.com OR from:jetbrains.com OR from:vercel.com OR from:grammarly.com OR from:coursera.org OR from:udemy.com OR from:skillshare.com) newer_than:5y',
  '(from:amazon.com OR from:primevideo.com OR from:twitch.tv OR from:patreon.com OR from:substack.com OR from:medium.com OR from:telegram.org OR from:x.com OR from:twitter.com) newer_than:5y',
  '(from:ivi.ru OR from:okko.tv OR from:amediateka.ru OR from:start.ru OR from:kion.ru OR from:kinopoisk.ru OR from:nordvpn.com OR from:surfshark.com OR from:expressvpn.com) newer_than:5y',
  '(from:disneyplus.com OR from:hulu.com OR from:max.com OR from:paramountplus.com OR from:deezer.com OR from:tidal.com OR from:soundcloud.com OR from:audible.com) newer_than:5y',
  '(from:playstation.com OR from:nintendo.com OR from:ea.com OR from:proton.me OR from:1password.com OR from:bitwarden.com OR from:lastpass.com) newer_than:5y',
  '(from:todoist.com OR from:evernote.com OR from:trello.com OR from:slack.com OR from:miro.com OR from:loom.com OR from:calendly.com OR from:airtable.com) newer_than:5y',
  '(from:asana.com OR from:clickup.com OR from:monday.com OR from:webflow.com OR from:wix.com OR from:squarespace.com OR from:shopify.com OR from:mailchimp.com) newer_than:5y',
  '(from:typeform.com OR from:framer.com OR from:linear.app OR from:replit.com OR from:cursor.com OR from:codepen.io OR from:codecademy.com OR from:brilliant.org OR from:masterclass.com) newer_than:5y'
  ,
  '(from:anthropic.com OR from:claude.ai OR from:perplexity.ai OR from:midjourney.com OR from:runwayml.com OR from:elevenlabs.io OR from:deepl.com OR from:quillbot.com) newer_than:5y',
  '(from:supabase.com OR from:firebase.google.com OR from:cloudflare.com OR from:netlify.com OR from:railway.app OR from:render.com OR from:digitalocean.com OR from:heroku.com) newer_than:5y',
  '(from:steamgames.com OR from:steampowered.com OR from:epicgames.com OR from:roblox.com OR from:ea.com OR from:riotgames.com OR from:chess.com OR from:lichess.org) newer_than:5y',
  '(from:godaddy.com OR from:namecheap.com OR from:porkbun.com OR from:hostinger.com OR from:bluehost.com OR from:wordpress.com OR from:ghost.org) newer_than:5y',
  '(from:paddle.com OR from:xsolla.com OR from:fastspring.com OR from:2checkout.com OR from:payproglobal.com OR from:gumroad.com OR from:lemonsqueezy.com OR from:mycommerce.com) newer_than:10y',
  '(from:litres.ru OR from:bookmate.com OR from:storytel.com OR from:premier.one OR from:more.tv OR from:wink.ru OR from:smotrim.ru OR from:cloud.mail.ru) newer_than:5y',
  '(from:kaspersky.com OR from:drweb.com OR from:avast.com OR from:avg.com OR from:malwarebytes.com OR from:eset.com OR from:bitdefender.com) newer_than:5y',
  '(from:getpostman.com OR from:postman.com OR from:docker.com OR from:gitlab.com OR from:atlassian.com OR from:openrouter.ai OR from:replicate.com) newer_than:5y'
];

function readPositiveIntegerEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const gmailMaxMessagesPerQuery = readPositiveIntegerEnv("TENGEGUARD_GMAIL_MAX_PER_QUERY", defaultMaxMessagesPerQuery);
const gmailMaxMessagesPerSync = readPositiveIntegerEnv("TENGEGUARD_GMAIL_MAX_MESSAGES", defaultMaxMessagesPerSync);

function getGoogleClientId(origin?: string) {
  const value = getGoogleOAuthConfig(origin).clientId;
  if (!value) throw new Error("Google sign-in is not configured");
  return value;
}

function getGoogleClientSecret(origin?: string) {
  const value = getGoogleOAuthConfig(origin).clientSecret;
  if (!value) throw new Error("Google Gmail access is not configured");
  return value;
}

function getAppUrl(origin?: string) {
  return getGoogleOAuthConfig(origin).appUrl;
}

function getRedirectUri(origin?: string) {
  return getGoogleOAuthConfig(origin).redirectUri;
}

export function getGmailRedirectUri(origin?: string) {
  return getRedirectUri(origin);
}

export function stableId(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export function userIdFromEmail(email: string) {
  return `usr_${stableId(email.toLowerCase())}`;
}

export function getUserIdFromRequest(request: Request) {
  const value = request.headers.get("cookie")?.match(/(?:^|;\s*)tg_user_id=([^;]+)/)?.[1];
  return value ? decodeURIComponent(value) : undefined;
}

function userDir(userId: string) {
  return path.join(rootPath, userId);
}

function tokenPath(userId: string) {
  return path.join(userDir(userId), "gmail-token.json");
}

function subscriptionPath(userId: string) {
  return path.join(userDir(userId), "subscriptions.json");
}

function reportPath(userId: string) {
  return path.join(userDir(userId), "gmail-sync-report.json");
}

function profilePath(userId: string) {
  return path.join(userDir(userId), "profile.json");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function extractText(payload: GmailMessage["payload"]): string {
  if (!payload) return "";

  const ownText = payload.body?.data ? base64UrlDecode(payload.body.data) : "";
  const childText = payload.parts?.map(extractText).join("\n") || "";
  return `${ownText}\n${childText}`
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function header(message: GmailMessage, name: string) {
  return message.payload?.headers?.find((item) => item.name.toLowerCase() === name.toLowerCase())?.value || "";
}

function messageDate(message: GmailMessage) {
  const fromHeader = header(message, "Date");
  if (fromHeader) return fromHeader;
  if (message.internalDate) return new Date(Number(message.internalDate)).toISOString();
  return undefined;
}

function mergeEvidence(existing: Subscription["evidence"], incoming: Subscription["evidence"]) {
  const map = new Map<string, Subscription["evidence"][number]>();
  [...existing, ...incoming].forEach((item) => {
    const key = `${item.source}:${item.message_id || item.subject || item.snippet || JSON.stringify(item.matched_signals)}`;
    map.set(key, item);
  });
  return Array.from(map.values());
}

function evidenceTime(subscription: Subscription) {
  const times = subscription.evidence
    .map((item) => (item.date ? new Date(item.date).getTime() : 0))
    .filter((time) => Number.isFinite(time));
  return times.length ? Math.max(...times) : 0;
}

function normalizeSubscriptionKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\wа-яёәғқңөұүһі+]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function subscriptionKey(subscription: Pick<Subscription, "provider_name" | "cancellation_path" | "cost" | "status">) {
  const provider = normalizeSubscriptionKey(subscription.provider_name);
  if (subscription.cost === 0 && subscription.status === "review") return provider;
  const cancellationPath = subscription.cancellation_path.includes("google.com/search") ? "" : subscription.cancellation_path;
  return `${provider}:${cancellationPath}`;
}

function hasRealGmailEvidence(subscription: Subscription) {
  const hasExternalEvidence = subscription.evidence.some((evidence) => evidence.source !== "gmail");
  const signals = new Set(subscription.evidence.flatMap((evidence) => evidence.matched_signals || []));

  if (subscription.status === "review" || subscription.type === "unknown") return false;
  if (subscription.confidence < 0.68) return false;
  if (!hasExternalEvidence && subscription.cancellation_path.includes("google.com/search")) return false;

  if (hasExternalEvidence) {
    return (
      subscription.cost > 0 &&
      Boolean(subscription.next_billing_date) &&
      (signals.has("payment") || signals.has("recurring"))
    );
  }

  const hasConfirmedShape =
    (subscription.type === "paid" &&
      subscription.cost > 0 &&
      (signals.has("receipt") || signals.has("invoice")) &&
      (signals.has("payment") || signals.has("renewal"))) ||
    (subscription.type === "free_trial" &&
      signals.has("trial") &&
      Boolean(subscription.trial_ends_at || subscription.next_billing_date)) ||
    (subscription.type === "free" &&
      subscription.confidence >= 0.78 &&
      signals.has("membership") &&
      !signals.has("cycle_estimate"));

  if (!hasConfirmedShape) return false;

  return subscription.evidence.some((evidence) => {
    const text = `${evidence.subject || ""}\n${evidence.from || ""}\n${evidence.snippet || ""}`;
    if (
      /(?:payment (?:failed|unsuccessful)|failed to process|was unsuccessful|insufficient funds|refund(?:ed|s| has been processed| request)|support ticket|how would you rate|rate the support|webinar|digest|newsletter|workflow run|job annotations|deploy to github pages|run failed|invitation from an unknown sender|updated invitation|this event isn't in your calendar|join with google meet|starts in 1 hour|starts in 1 day|starts in 1 week|discover the world|unlock the top|limited time|get \$?\d+ off|get \d+\s+months? of|extend your trial|sign up to|sign up for|try (?:it|for|now)|try (?:a )?free subscription|reward|coupon|gift calendar|loyalty|discount|prize|you won|add stripe|stripe and seo included|pricing ends|current pricing|scheduled for deletion|most students submit|olympiads|calendar released|temu|welcome to chess\.com|добро пожаловать на chess\.com|попробовать бесплатн|награда|купон|скидк|приз|календарь подарков|срок действия истекает|вы выиграли)/i.test(text)
    ) {
      return false;
    }

    const strongSignals = evidence.matched_signals.filter((signal) =>
      ["receipt", "invoice", "renewal", "billing_date", "trial", "payment", "membership", "cycle_estimate"].includes(signal)
    );

    return Boolean(evidence.message_id || evidence.subject || evidence.from || evidence.snippet) && strongSignals.length > 0;
  });
}

function mergeSubscriptions(existing: Subscription, incoming: Subscription): Subscription {
  const incomingIsPaid = incoming.cost > 0;
  const existingIsPaid = existing.cost > 0;
  const incomingIsNewer = evidenceTime(incoming) >= evidenceTime(existing);
  const useIncomingPrice = incomingIsPaid && (!existingIsPaid || incomingIsNewer);
  const useIncomingCancellationPath =
    existing.cancellation_path.includes("google.com/search") && !incoming.cancellation_path.includes("google.com/search");

  return {
    ...existing,
    provider_name:
      useIncomingCancellationPath || incoming.provider_name.length > existing.provider_name.length
        ? incoming.provider_name
        : existing.provider_name,
    cost: useIncomingPrice || !existingIsPaid ? incoming.cost : existing.cost,
    currency: useIncomingPrice || !existingIsPaid ? incoming.currency : existing.currency,
    billing_cycle: incoming.billing_cycle !== "unknown" ? incoming.billing_cycle : existing.billing_cycle,
    next_billing_date: incoming.next_billing_date || existing.next_billing_date,
    trial_ends_at: incoming.trial_ends_at || existing.trial_ends_at,
    status:
      incoming.status === "active" || existing.status === "active"
        ? "active"
        : incoming.status === "trial" || existing.status === "trial"
          ? "trial"
          : incoming.status === "review" || existing.status === "review"
            ? "review"
            : existing.status,
    type: mergeSubscriptionType(existing.type, incoming.type),
    cancellation_path: useIncomingCancellationPath ? incoming.cancellation_path : existing.cancellation_path,
    confidence: Math.max(existing.confidence, incoming.confidence),
    evidence: mergeEvidence(existing.evidence, incoming.evidence),
    last_seen_at: incoming.last_seen_at > existing.last_seen_at ? incoming.last_seen_at : existing.last_seen_at
  };
}

function dedupeSubscriptions(subscriptions: Subscription[]) {
  const merged = new Map<string, Subscription>();

  subscriptions.filter(hasRealGmailEvidence).forEach((subscription) => {
    const key = subscriptionKey(subscription);
    const existing = merged.get(key);
    merged.set(key, existing ? mergeSubscriptions(existing, subscription) : subscription);
  });

  return Array.from(merged.values()).sort((a, b) => {
    const dateA = a.next_billing_date || "9999-12-31";
    const dateB = b.next_billing_date || "9999-12-31";
    return dateA.localeCompare(dateB) || a.provider_name.localeCompare(b.provider_name);
  });
}

function toSubscription(userId: string, receipt: ReturnType<typeof parseEmailReceipts>[number]): Subscription {
  const status = receipt.status || "active";
  const key = subscriptionKey({ ...receipt, status });
  return {
    id: `sub_${stableId(`${userId}:${key}`)}`,
    user_id: userId,
    status,
    last_seen_at: new Date().toISOString(),
    ...receipt
  };
}

async function writeJson(filePath: string, data: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, JSON.stringify(data, null, 2), "utf8");
  await rename(tempPath, filePath);
}

async function saveTokens(userId: string, tokens: StoredTokens) {
  await writeJson(tokenPath(userId), tokens);
}

export async function saveSessionUser(user: SessionUser) {
  await writeJson(profilePath(user.id), user);
}

export function isGmailConfigured(origin?: string) {
  return getGoogleOAuthConfig(origin).configured;
}

export function buildGmailConnectUrl(origin?: string) {
  const clientId = getGoogleClientId(origin);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(origin),
    response_type: "code",
    scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: "tengeguard:gmail"
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function readTokens(userId?: string): Promise<StoredTokens | null> {
  if (!userId) return null;
  try {
    return JSON.parse(await readFile(tokenPath(userId), "utf8")) as StoredTokens;
  } catch {
    return null;
  }
}

async function getAccessToken(userId: string) {
  const tokens = await readTokens(userId);
  if (!tokens) throw new Error("Gmail account is not connected");

  if (tokens.expires_at > Date.now() + 60_000) return tokens.access_token;
  if (!tokens.refresh_token) throw new Error("Gmail token expired and no refresh token exists");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token"
    })
  });

  if (!response.ok) throw new Error("Failed to refresh Gmail token");
  const refreshed = (await response.json()) as GoogleTokenResponse;
  const nextTokens = {
    access_token: refreshed.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + refreshed.expires_in * 1000,
    email: tokens.email,
    name: tokens.name,
    avatar_url: tokens.avatar_url,
    scope: refreshed.scope || tokens.scope
  };
  await saveTokens(userId, nextTokens);
  return nextTokens.access_token;
}

export async function exchangeGmailCode(code: string, origin?: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getGoogleClientId(origin),
      client_secret: getGoogleClientSecret(origin),
      redirect_uri: getRedirectUri(origin),
      grant_type: "authorization_code"
    })
  });

  if (!response.ok) throw new Error("Failed to exchange Gmail OAuth code");
  const tokens = (await response.json()) as GoogleTokenResponse;
  const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });
  const userInfo = userInfoResponse.ok ? ((await userInfoResponse.json()) as GoogleUserInfo) : {};
  if (!userInfo.email) throw new Error("Google did not return account email");

  const userId = userIdFromEmail(userInfo.email);
  const storedTokens = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
    email: userInfo.email,
    name: userInfo.name,
    avatar_url: userInfo.picture,
    scope: tokens.scope
  };

  await saveTokens(userId, storedTokens);
  return toSessionUser(userId, storedTokens);
}

function toSessionUser(userId: string, tokens: StoredTokens): SessionUser {
  return {
    id: userId,
    email: tokens.email,
    name: tokens.name || tokens.email,
    avatar_url: tokens.avatar_url
  };
}

async function gmailFetch<T>(pathName: string, accessToken: string) {
  let lastStatus = 0;
  let lastMessage = "";

  for (let attempt = 0; attempt <= gmailFetchRetryCount; attempt += 1) {
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${pathName}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (response.ok) return (await response.json()) as T;

    lastStatus = response.status;
    lastMessage = await response.text().catch(() => "");
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === gmailFetchRetryCount) break;

    const retryAfter = Number(response.headers.get("retry-after"));
    const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 750 * (attempt + 1) ** 2;
    await sleep(delay);
  }

  throw new Error(`Gmail API failed: ${lastStatus}${lastMessage ? ` ${lastMessage.slice(0, 240)}` : ""}`);
}

async function listMessageIds(accessToken: string, query: string, maxMessagesPerQuery = 75) {
  const ids: string[] = [];
  let pageToken: string | undefined;

  while (ids.length < maxMessagesPerQuery) {
    const params = new URLSearchParams({
      q: query,
      maxResults: String(Math.min(100, maxMessagesPerQuery - ids.length)),
      includeSpamTrash: "true"
    });
    if (pageToken) params.set("pageToken", pageToken);

    const list = await gmailFetch<GmailListResponse>(`messages?${params.toString()}`, accessToken);
    ids.push(...(list.messages || []).map((message) => message.id));
    pageToken = list.nextPageToken;
    if (!pageToken || !list.messages?.length) break;
  }

  return ids;
}

async function mapInBatches<T, R>(items: T[], batchSize: number, mapper: (item: T) => Promise<R>) {
  const results: R[] = [];
  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    results.push(...(await Promise.all(batch.map(mapper))));
    if (index + batchSize < items.length) await sleep(250);
  }
  return results;
}

function mergeSubscriptionType(existing: Subscription["type"], incoming: Subscription["type"]) {
  const priority: Record<Subscription["type"], number> = {
    unknown: 0,
    free: 1,
    free_trial: 2,
    paid: 3
  };
  return priority[incoming] > priority[existing] ? incoming : existing;
}

export async function syncRealGmailSubscriptions(userId: string) {
  const accessToken = await getAccessToken(userId);
  const tokens = await readTokens(userId);
  const messageIds = new Set<string>();

  for (const query of gmailQueries) {
    const ids = await listMessageIds(accessToken, query, gmailMaxMessagesPerQuery);
    ids.forEach((id) => messageIds.add(id));
  }

  const messages = await mapInBatches(
    Array.from(messageIds).slice(0, gmailMaxMessagesPerSync),
    gmailFetchBatchSize,
    (messageId) => gmailFetch<GmailMessage>(`messages/${messageId}?format=full`, accessToken)
  );

  const parsed = messages.flatMap((message) =>
    parseEmailReceipts({
      body: `${message.snippet || ""}\n${extractText(message.payload)}`,
      messageId: message.id,
      subject: header(message, "Subject"),
      from: header(message, "From"),
      date: messageDate(message),
      snippet: message.snippet
    })
  );

  const existing = await readRealGmailSubscriptions(userId);
  const subscriptions = dedupeSubscriptions([...existing, ...parsed.map((receipt) => toSubscription(userId, receipt))]);

  await writeJson(subscriptionPath(userId), subscriptions);
  await writeJson(reportPath(userId), {
    ok: true,
    scanned_at: new Date().toISOString(),
    messages_scanned: messages.length,
    subscriptions_found: subscriptions.length,
    query_count: gmailQueries.length,
    user_email: tokens?.email
  } satisfies SyncReport);

  return subscriptions;
}

export async function readRealGmailSubscriptions(userId?: string) {
  if (!userId) return [];
  try {
    const stored = JSON.parse(await readFile(subscriptionPath(userId), "utf8")) as Subscription[];
    const subscriptions = dedupeSubscriptions(stored);
    if (subscriptions.length !== stored.length) {
      await writeJson(subscriptionPath(userId), subscriptions);
    }
    return subscriptions;
  } catch {
    return [];
  }
}

export async function saveImportedSubscriptions(userId: string, incoming: Subscription[]) {
  const existing = await readRealGmailSubscriptions(userId);
  const subscriptions = dedupeSubscriptions([...existing, ...incoming]);
  await writeJson(subscriptionPath(userId), subscriptions);
  return subscriptions;
}

export async function readSyncReport(userId?: string): Promise<SyncReport | null> {
  if (!userId) return null;
  try {
    return JSON.parse(await readFile(reportPath(userId), "utf8")) as SyncReport;
  } catch {
    return null;
  }
}

export async function getSessionUser(userId?: string) {
  const tokens = await readTokens(userId);
  if (!userId) return null;
  if (tokens) return toSessionUser(userId, tokens);

  try {
    return JSON.parse(await readFile(profilePath(userId), "utf8")) as SessionUser;
  } catch {
    return null;
  }
}

export async function deleteRealGmailSubscription(userId: string, id: string) {
  const subscriptions = await readRealGmailSubscriptions(userId);
  const next = subscriptions.filter((subscription) => subscription.id !== id);
  await writeJson(subscriptionPath(userId), next);
  return next;
}

export async function markRealGmailSubscriptionCancelled(userId: string, id: string) {
  const subscriptions = await readRealGmailSubscriptions(userId);
  let updated: Subscription | null = null;
  const next = subscriptions.map((subscription) => {
    if (subscription.id !== id) return subscription;

    updated = {
      ...subscription,
      status: "cancelled",
      cancellation_confirmed_at: new Date().toISOString()
    };
    return updated;
  });

  if (!updated) return null;

  await writeJson(subscriptionPath(userId), next);
  return updated;
}
