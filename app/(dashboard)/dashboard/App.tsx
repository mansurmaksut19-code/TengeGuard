"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  Bot,
  CalendarDays,
  CheckCircle2,
  Database,
  ExternalLink,
  Globe2,
  KeyRound,
  Laptop,
  Loader2,
  LogOut,
  LockKeyhole,
  MailCheck,
  MessageCircle,
  PlugZap,
  Radar,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserCog,
  UserCircle2,
  WalletCards
} from "lucide-react";

type Locale = "ru" | "en" | "kk";
type BillingCycle = "monthly" | "yearly" | "weekly" | "unknown";
type SubscriptionStatus = "active" | "cancelled" | "trial" | "review";
type SubscriptionType = "paid" | "free_trial" | "free" | "unknown";
type DashboardFilter = "all" | "paid" | "free" | "trial" | "review";
type DashboardView = "dashboard" | "subscriptions" | "evidence" | "access" | "history" | "ai" | "account";
type DeviceMode = "mobile" | "desktop";

type AiMessage = {
  role: "user" | "assistant";
  content: string;
};

type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
};

type SubscriptionEvidence = {
  source: "gmail" | "bank" | "google_takeout" | "apple_export" | "open_banking";
  message_id?: string;
  subject?: string;
  from?: string;
  date?: string;
  snippet?: string;
  matched_signals: string[];
};

type Subscription = {
  id: string;
  user_id: string;
  provider_name: string;
  cost: number;
  currency: string;
  billing_cycle: BillingCycle;
  next_billing_date: string | null;
  status: SubscriptionStatus;
  type: SubscriptionType;
  trial_ends_at?: string | null;
  cancellation_path: string;
  confidence: number;
  evidence: SubscriptionEvidence[];
  last_seen_at: string;
  cancellation_confirmed_at?: string | null;
};

type GmailStatus = {
  ok: boolean;
  configured: boolean;
  identityConfigured: boolean;
  gisClientId: string | null;
  connected: boolean;
  connectUrl: string | null;
  user: SessionUser | null;
  scope: string | null;
  report: {
    ok: boolean;
    scanned_at: string;
    messages_scanned: number;
    subscriptions_found: number;
    query_count: number;
    user_email?: string;
    error?: string;
  } | null;
};

type TelegramStatus = {
  ok: boolean;
  configured: boolean;
  botName: string;
  botUsername: string;
  connected: boolean;
  notificationsEnabled: boolean;
  connectUrl: string | null;
  chat: {
    username?: string;
    first_name?: string;
    linked_at: string;
  } | null;
};

type ConnectorStatus = {
  id: "gmail" | "bank" | "google_account" | "apple";
  name: string;
  status: "connected" | "ready" | "setup_required" | "not_available";
  coverage: string;
  action: string;
  setup?: string;
};

type CancellationResult = {
  id: string;
  provider_name: string;
  status: "auto_cancelled" | "needs_user_action" | "unsupported";
  cancellation_path: string;
  reason: string;
};

type CancelSubscriptionResponse = {
  ok: boolean;
  result: CancellationResult;
};

type AiChatResponse = {
  ok: boolean;
  answer: string;
  model?: string;
};

const localeLabels: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  kk: "Қазақша"
};

const localeTags: Record<Locale, string> = {
  ru: "ru-RU",
  en: "en-US",
  kk: "kk-KZ"
};

const copy = {
  ru: {
    overview: "Обзор",
    subscriptionsNav: "Подписки",
    evidenceNav: "Доказательства",
    accessNav: "Доступ",
    historyNav: "История",
    aiNav: "ИИ-чат",
    accountNav: "Аккаунт",
    activeProtection: "Активная защита",
    totalMonthlySpend: "Сумма в месяц",
    nextBilling: "Следующее списание",
    googleConnected: "Google подключен",
    googleDisconnected: "Google не подключен",
    activeConnection: "Активное подключение",
    lastScan: "Последний scan",
    scanNow: "Сканировать Gmail",
    scanning: "Идет анализ Gmail",
    continueGoogle: "Продолжить через Google",
    reconnectGoogle: "Переподключить Google",
    serverMissing: "Google OAuth не настроен",
    activeSubscriptions: "Активные подписки",
    endingSoon: "Скоро заканчивается",
    needsReview: "Нужно проверить",
    realEvidenceOnly: "Только реальные доказательства",
    readOnly: "Gmail read-only",
    telegramTitle: "Telegram Bot",
    telegramText: "Мгновенные уведомления о списаниях, trial и free-периодах.",
    telegramConnect: "Подключить Telegram",
    telegramTest: "Отправить тест",
    telegramSent: "Тестовое сообщение отправлено в Telegram.",
    subscriptionsTitle: "Ваши подписки",
    subscriptionsText: "Текущие подписки, бесплатные тарифы и trial-периоды, найденные по реальным доказательствам.",
    allFilter: "Все",
    paidFilter: "Платные",
    freeFilter: "Бесплатные",
    trialFilter: "Trial",
    reviewFilter: "Проверить",
    search: "Поиск по подписке, письму или отправителю",
    showing: "Показано",
    paid: "Платные",
    free: "Бесплатные",
    trials: "Trial",
    evidence: "Доказательства",
    confidence: "Достоверность",
    trustScore: "Trust score",
    cancel: "Отменить подписку",
    cancelling: "Открываем отмену...",
    markCancelled: "Я отменил",
    markingCancelled: "Сохраняем...",
    cancelConfirmed: "Подписка перенесена в историю отмененных.",
    needsUserActionCancel: "Нужен вход в сервис",
    unsupportedCancel: "Нет канала отмены",
    autoCancelled: "Автоотменено",
    systemCancelNote: "TengeGuard не будет фейково помечать подписку отмененной. Если сервис требует вход, 2FA или подтверждение, система покажет официальный путь.",
    remove: "Убрать",
    noSubsTitle: "Реальные подписки пока не найдены",
    noSubsText: "Подключите Google и запустите сканирование Gmail. Если доказательств нет, TengeGuard честно покажет пусто.",
    evidenceTitle: "Gmail Evidence",
    evidenceText: "Аудит-лог писем, на основе которых TengeGuard нашел подписки.",
    verifiedData: "Verified data from your Gmail",
    sourceLocked: "Источник защищен",
    accessTitle: "Доступ и интеграции",
    accessText: "Управляйте подключениями Google, Telegram и будущими источниками данных.",
    privacy: "Пароль Gmail не нужен и не хранится. Доступ выдает Google через OAuth, пользователь может отозвать его в Google Account.",
    connectBank: "Подключить банк",
    syncAll: "Найти автоматически",
    syncingAll: "Ищем...",
    currentSubscriptions: "Текущие подписки",
    cancelledSubscriptions: "Отмененные подписки",
    cancelledEmpty: "Отмененных подписок пока нет.",
    found: "Найдено",
    messages: "Писем проверено",
    billing: "Цикл",
    renewal: "Продление",
    periodEnds: "Окончание периода",
    dateMissing: "дата не найдена",
    queries: "запросов",
    error: "Ошибка",
    loadingTitle: "TengeGuard готовит дашборд",
    loadingText: "Проверяем доступ, квитанции и регулярные списания.",
    aiTitle: "ИИ-чат TengeGuard",
    aiText: "Спросите что угодно: про подписки, расходы, отмену, trial-периоды или любые идеи по продукту.",
    aiPlaceholder: "Например: какие подписки стоит проверить в первую очередь?",
    aiSend: "Отправить",
    accountTitle: "Аккаунт",
    accountText: "Управляйте Google-аккаунтом, режимом интерфейса и подключениями.",
    changeAccount: "Сменить Google-аккаунт",
    changeMode: "Сменить режим",
    logout: "Выйти"
  },
  en: {
    overview: "Overview",
    subscriptionsNav: "Subscriptions",
    evidenceNav: "Evidence",
    accessNav: "Access",
    historyNav: "History",
    aiNav: "AI Chat",
    accountNav: "Account",
    activeProtection: "Active Protection",
    totalMonthlySpend: "Total Monthly Spend",
    nextBilling: "Next Billing",
    googleConnected: "Google connected",
    googleDisconnected: "Google not connected",
    activeConnection: "Active connection",
    lastScan: "Last scan",
    scanNow: "Scan Gmail",
    scanning: "Analyzing Gmail",
    continueGoogle: "Continue with Google",
    reconnectGoogle: "Reconnect Google",
    serverMissing: "Google OAuth is not configured",
    activeSubscriptions: "Active subscriptions",
    endingSoon: "Ending soon",
    needsReview: "Needs review",
    realEvidenceOnly: "Real evidence only",
    readOnly: "Gmail read-only",
    telegramTitle: "Telegram Bot",
    telegramText: "Instant alerts for renewals, trials, and free periods.",
    telegramConnect: "Connect Telegram",
    telegramTest: "Send test",
    telegramSent: "Test message sent to Telegram.",
    subscriptionsTitle: "Your subscriptions",
    subscriptionsText: "Current subscriptions, free plans, and trials found from real evidence.",
    allFilter: "All",
    paidFilter: "Paid",
    freeFilter: "Free",
    trialFilter: "Trial",
    reviewFilter: "Review",
    search: "Search subscription, email, or sender",
    showing: "Showing",
    paid: "Paid",
    free: "Free",
    trials: "Trial",
    evidence: "Evidence",
    confidence: "Confidence",
    trustScore: "Trust score",
    cancel: "Cancel subscription",
    cancelling: "Opening cancellation...",
    markCancelled: "I cancelled it",
    markingCancelled: "Saving...",
    cancelConfirmed: "Subscription moved to cancelled history.",
    needsUserActionCancel: "Provider sign-in needed",
    unsupportedCancel: "No cancellation channel",
    autoCancelled: "Auto-cancelled",
    systemCancelNote: "TengeGuard will not falsely mark a subscription as cancelled. If a provider requires sign-in, 2FA, or confirmation, the system shows the official path.",
    remove: "Remove",
    noSubsTitle: "No real subscriptions found yet",
    noSubsText: "Connect Google and run a Gmail scan. If there is no evidence, TengeGuard shows empty results.",
    evidenceTitle: "Gmail Evidence",
    evidenceText: "Audit trail of emails used to detect subscriptions.",
    verifiedData: "Verified data from your Gmail",
    sourceLocked: "Source locked",
    accessTitle: "Access and integrations",
    accessText: "Manage Google, Telegram, and future data sources.",
    privacy: "Gmail password is never requested or stored. Google grants OAuth access, and the user can revoke it in Google Account.",
    connectBank: "Connect bank",
    syncAll: "Find automatically",
    syncingAll: "Finding...",
    currentSubscriptions: "Current subscriptions",
    cancelledSubscriptions: "Cancelled subscriptions",
    cancelledEmpty: "No cancelled subscriptions yet.",
    found: "Found",
    messages: "Messages scanned",
    billing: "Cycle",
    renewal: "Renewal",
    periodEnds: "Period ends",
    dateMissing: "date missing",
    queries: "queries",
    error: "Error",
    loadingTitle: "TengeGuard is preparing dashboard",
    loadingText: "Checking access, receipts, and recurring charges.",
    aiTitle: "TengeGuard AI Chat",
    aiText: "Ask anything about subscriptions, spending, cancellation, trials, or product ideas.",
    aiPlaceholder: "Example: which subscriptions should I review first?",
    aiSend: "Send",
    accountTitle: "Account",
    accountText: "Manage your Google account, interface mode, and connections.",
    changeAccount: "Change Google account",
    changeMode: "Change mode",
    logout: "Sign out"
  },
  kk: {
    overview: "Шолу",
    subscriptionsNav: "Жазылымдар",
    evidenceNav: "Дәлелдер",
    accessNav: "Рұқсат",
    historyNav: "Тарих",
    aiNav: "AI чат",
    accountNav: "Аккаунт",
    activeProtection: "Белсенді қорғаныс",
    totalMonthlySpend: "Айлық шығын",
    nextBilling: "Келесі төлем",
    googleConnected: "Google қосылды",
    googleDisconnected: "Google қосылмаған",
    activeConnection: "Белсенді қосылым",
    lastScan: "Соңғы scan",
    scanNow: "Gmail сканерлеу",
    scanning: "Gmail талдануда",
    continueGoogle: "Google арқылы жалғастыру",
    reconnectGoogle: "Google қайта қосу",
    serverMissing: "Google OAuth бапталмаған",
    activeSubscriptions: "Белсенді жазылымдар",
    endingSoon: "Жақында аяқталады",
    needsReview: "Тексеру керек",
    realEvidenceOnly: "Тек нақты дәлелдер",
    readOnly: "Gmail тек оқу",
    telegramTitle: "Telegram Bot",
    telegramText: "Төлем, trial және free кезеңдері туралы хабарламалар.",
    telegramConnect: "Telegram қосу",
    telegramTest: "Тест жіберу",
    telegramSent: "Telegram-ға тест хабарлама жіберілді.",
    subscriptionsTitle: "Сіздің жазылымдар",
    subscriptionsText: "Нақты дәлелдерден табылған қазіргі жазылымдар, free plans және trials.",
    allFilter: "Барлығы",
    paidFilter: "Ақылы",
    freeFilter: "Тегін",
    trialFilter: "Trial",
    reviewFilter: "Тексеру",
    search: "Жазылым, хат немесе жіберуші бойынша іздеу",
    showing: "Көрсетілді",
    paid: "Ақылы",
    free: "Тегін",
    trials: "Trial",
    evidence: "Дәлелдер",
    confidence: "Сенімділік",
    trustScore: "Trust score",
    cancel: "Жазылымды тоқтату",
    cancelling: "Тоқтату ашылуда...",
    markCancelled: "Мен тоқтаттым",
    markingCancelled: "Сақталуда...",
    cancelConfirmed: "Жазылым тоқтатылғандар тарихына көшірілді.",
    needsUserActionCancel: "Сервиске кіру керек",
    unsupportedCancel: "Тоқтату арнасы жоқ",
    autoCancelled: "Автоматты тоқтатылды",
    systemCancelNote: "TengeGuard жазылымды жалған түрде тоқтатылды деп белгілемейді. Егер сервис кіруді, 2FA немесе растауды талап етсе, жүйе ресми жолды көрсетеді.",
    remove: "Өшіру",
    noSubsTitle: "Әзірге нақты жазылым табылмады",
    noSubsText: "Google қосып, Gmail сканерлеуді бастаңыз. Дәлел болмаса, TengeGuard бос нәтиже көрсетеді.",
    evidenceTitle: "Gmail Evidence",
    evidenceText: "Жазылымдарды анықтауға қолданылған хаттар аудиті.",
    verifiedData: "Gmail-ден расталған дерек",
    sourceLocked: "Дереккөзі қорғалған",
    accessTitle: "Рұқсат және интеграциялар",
    accessText: "Google, Telegram және болашақ дерек көздерін басқарыңыз.",
    privacy: "Gmail құпиясөзі сұралмайды және сақталмайды. Рұқсатты Google OAuth арқылы береді.",
    connectBank: "Банк қосу",
    syncAll: "Автоматты табу",
    syncingAll: "Ізделуде...",
    currentSubscriptions: "Қазіргі жазылымдар",
    cancelledSubscriptions: "Тоқтатылған жазылымдар",
    cancelledEmpty: "Әзірге тоқтатылған жазылым жоқ.",
    found: "Табылды",
    messages: "Хат тексерілді",
    billing: "Цикл",
    renewal: "Ұзарту",
    periodEnds: "Кезең аяқталады",
    dateMissing: "күн табылмады",
    queries: "сұраныс",
    error: "Қате",
    loadingTitle: "TengeGuard дашборд дайындауда",
    loadingText: "Рұқсат, чектер және тұрақты төлемдер тексерілуде.",
    aiTitle: "TengeGuard AI чат",
    aiText: "Жазылымдар, шығындар, тоқтату, trial кезеңдері немесе өнім идеялары туралы сұраңыз.",
    aiPlaceholder: "Мысалы: қай жазылымдарды алдымен тексеру керек?",
    aiSend: "Жіберу",
    accountTitle: "Аккаунт",
    accountText: "Google аккаунтын, интерфейс режимін және қосылымдарды басқарыңыз.",
    changeAccount: "Google аккаунтын ауыстыру",
    changeMode: "Режимді ауыстыру",
    logout: "Шығу"
  }
};

const subscriptionTypeLabels: Record<Locale, Record<SubscriptionType, string>> = {
  ru: { paid: "Платная", free_trial: "Trial", free: "Бесплатная", unknown: "Проверить" },
  en: { paid: "Paid", free_trial: "Trial", free: "Free", unknown: "Review" },
  kk: { paid: "Ақылы", free_trial: "Trial", free: "Тегін", unknown: "Тексеру" }
};

const billingCycleLabels: Record<Locale, Record<BillingCycle, string>> = {
  ru: { monthly: "ежемесячно", yearly: "ежегодно", weekly: "еженедельно", unknown: "цикл не найден" },
  en: { monthly: "monthly", yearly: "yearly", weekly: "weekly", unknown: "cycle missing" },
  kk: { monthly: "ай сайын", yearly: "жыл сайын", weekly: "апта сайын", unknown: "цикл табылмады" }
};

const signalLabels: Record<Locale, Record<string, string>> = {
  ru: {
    receipt: "чек",
    invoice: "счет",
    renewal: "продление",
    billing_date: "дата списания",
    trial: "trial",
    payment: "оплата",
    free_plan: "free plan",
    membership: "подписка",
    cycle_estimate: "расчет по циклу",
    welcome: "регистрация"
  },
  en: {
    receipt: "receipt",
    invoice: "invoice",
    renewal: "renewal",
    billing_date: "billing date",
    trial: "trial",
    payment: "payment",
    free_plan: "free plan",
    membership: "membership",
    cycle_estimate: "cycle estimate",
    welcome: "signup"
  },
  kk: {
    receipt: "чек",
    invoice: "шот",
    renewal: "ұзарту",
    billing_date: "төлем күні",
    trial: "trial",
    payment: "төлем",
    free_plan: "free plan",
    membership: "жазылым",
    cycle_estimate: "цикл бойынша есеп",
    welcome: "тіркелу"
  }
};

const dashboardProgressSteps = [
  "Подключаемся к аккаунту...",
  "Ищем квитанции Apple и Google Play...",
  "Анализируем ежемесячные траты..."
];

type AuthStage = "idle" | "identity" | "consent" | "scan";

function typeLabel(type: SubscriptionType, locale: Locale) {
  return subscriptionTypeLabels[locale][type];
}

function cycleLabel(cycle: BillingCycle, locale: Locale) {
  return billingCycleLabels[locale][cycle];
}

function signalLabel(signal: string, locale: Locale) {
  return signalLabels[locale][signal] || signal.replace(/_/g, " ");
}

function evidenceSourceLabel(source: SubscriptionEvidence["source"]) {
  return {
    gmail: "Gmail",
    bank: "Bank",
    google_takeout: "Google Takeout",
    apple_export: "Apple",
    open_banking: "Open Banking"
  }[source];
}

function filterLabel(filter: DashboardFilter, locale: Locale) {
  const t = copy[locale];
  return {
    all: t.allFilter,
    paid: t.paidFilter,
    free: t.freeFilter,
    trial: t.trialFilter,
    review: t.reviewFilter
  }[filter];
}

function needsHumanReview(subscription: Subscription) {
  return subscription.status === "review" || subscription.type === "unknown" || subscription.billing_cycle === "unknown" || subscription.confidence < 0.72;
}

function daysUntil(date: string | null | undefined) {
  if (!date) return null;
  const target = new Date(date).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
}

function isDueSoon(subscription: Subscription) {
  const due = daysUntil(subscription.trial_ends_at || subscription.next_billing_date);
  return due !== null && due >= 0 && due <= 14;
}

function monthlyEquivalent(subscription: Subscription) {
  if (subscription.billing_cycle === "yearly") return subscription.cost / 12;
  if (subscription.billing_cycle === "weekly") return subscription.cost * 4.345;
  return subscription.cost;
}

function currencyTotals(subscriptions: Subscription[]) {
  const totals = new Map<string, number>();
  subscriptions
    .filter((item) => item.cost > 0 && (item.status === "active" || item.status === "trial"))
    .forEach((item) => {
      totals.set(item.currency, (totals.get(item.currency) || 0) + monthlyEquivalent(item));
    });

  return Array.from(totals.entries())
    .map(([currency, amount]) => `${amount.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ${currency}`)
    .join(" + ");
}

function priceLabel(subscription: Subscription, locale: Locale) {
  if (subscription.cost > 0) {
    return `${subscription.cost.toLocaleString(localeTags[locale], { maximumFractionDigits: 2 })} ${subscription.currency}`;
  }
  return typeLabel(subscription.type, locale);
}

function formatDate(date: string | null | undefined, locale: Locale) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat(localeTags[locale], { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
}

function dateLabel(date: string | null | undefined, locale: Locale) {
  if (!date) return copy[locale].dateMissing;
  const diff = daysUntil(date);
  if (diff === null) return formatDate(date, locale);
  if (diff === 0) return locale === "en" ? "today" : locale === "kk" ? "бүгін" : "сегодня";
  if (diff === 1) return locale === "en" ? "tomorrow" : locale === "kk" ? "ертең" : "завтра";
  if (diff < 0) return locale === "en" ? "expired" : locale === "kk" ? "аяқталды" : "закончилось";
  return `${formatDate(date, locale)} · ${diff} ${locale === "en" ? "d" : locale === "kk" ? "күн" : "дн."}`;
}

async function readJson<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
  }
  return data as T;
}

export default function App({
  initialDeviceMode = "desktop",
  initialView = "dashboard"
}: {
  initialDeviceMode?: DeviceMode;
  initialView?: DashboardView;
} = {}) {
  const [locale, setLocale] = useState<Locale>("ru");
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus | null>(null);
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DashboardFilter>("all");
  const [activeView, setActiveView] = useState<DashboardView>(initialView);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [telegramTesting, setTelegramTesting] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    {
      role: "assistant",
      content: "Я ИИ-помощник TengeGuard. Могу помочь разобраться с подписками, trial-периодами, отменой, расходами и идеями по продукту."
    }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [aiSending, setAiSending] = useState(false);
  const [cancellingSubscriptionId, setCancellingSubscriptionId] = useState<string | null>(null);
  const [markingCancelledId, setMarkingCancelledId] = useState<string | null>(null);
  const [googleSigningIn, setGoogleSigningIn] = useState(false);
  const [authStage, setAuthStage] = useState<AuthStage>("idle");
  const [progressStep, setProgressStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const callbackSyncStartedRef = useRef(false);
  const telegramPollTimerRef = useRef<number | null>(null);
  const t = copy[locale];
  const isMobileMode = initialDeviceMode === "mobile";
  const isPreparingDashboard = loading || googleSigningIn || syncing || authStage !== "idle";
  const canStartGoogleOAuth = Boolean(status?.connectUrl || status?.configured);
  const googleSignInUnavailable = !loading && !canStartGoogleOAuth;

  const load = useCallback(async () => {
    const [gmailStatus, telegram] = await Promise.all([
      readJson<GmailStatus>("/api/subcut/gmail/status"),
      readJson<TelegramStatus>("/api/telegram/status")
    ]);
    setStatus(gmailStatus);
    setTelegramStatus(telegram);

    if (gmailStatus.connected) {
      const [subscriptionData, connectorData] = await Promise.all([
        readJson<{ subscriptions: Subscription[] }>("/api/subscriptions"),
        readJson<{ connectors: ConnectorStatus[] }>("/api/connectors/status")
      ]);
      setSubscriptions(subscriptionData.subscriptions);
      setConnectors(connectorData.connectors);
    } else {
      setSubscriptions([]);
      setConnectors([]);
    }
  }, []);

  useEffect(() => {
    load()
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : t.error))
      .finally(() => setLoading(false));
  }, [load, t.error]);

  useEffect(() => {
    return () => {
      if (telegramPollTimerRef.current) window.clearInterval(telegramPollTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isPreparingDashboard) {
      setProgressStep(0);
      return;
    }

    const timer = window.setInterval(() => {
      setProgressStep((current) => Math.min(current + 1, dashboardProgressSteps.length - 1));
    }, 1400);

    return () => window.clearInterval(timer);
  }, [isPreparingDashboard]);

  const runDashboardSync = useCallback(async () => {
    setSyncing(true);
    setAuthStage("scan");
    setError(null);
    setNotice(null);

    try {
      await readJson<{ ok: true }>("/api/sync", { method: "POST" });
      await load();
    } catch {
      setError("Не удалось завершить сканирование Gmail. Проверьте доступ Gmail readonly и попробуйте еще раз.");
    } finally {
      setSyncing(false);
      setAuthStage("idle");
    }
  }, [load]);

  useEffect(() => {
    if (loading || !status?.connected || callbackSyncStartedRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const shouldScan = params.get("scan") === "1";
    const justConnected = params.get("gmail") === "connected";
    if (!shouldScan && !justConnected) return;

    callbackSyncStartedRef.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    if (!shouldScan) {
      setNotice("Google подключен. Нажмите «Сканировать Gmail», чтобы найти реальные подписки.");
      return;
    }

    void runDashboardSync();
  }, [loading, runDashboardSync, status?.connected]);

  const activeSubscriptions = useMemo(() => subscriptions.filter((item) => item.status !== "cancelled"), [subscriptions]);
  const cancelledSubscriptions = useMemo(() => subscriptions.filter((item) => item.status === "cancelled"), [subscriptions]);

  const sortedSubscriptions = useMemo(() => {
    return [...activeSubscriptions].sort((a, b) => {
      const aReview = needsHumanReview(a) ? 0 : 1;
      const bReview = needsHumanReview(b) ? 0 : 1;
      if (aReview !== bReview) return aReview - bReview;

      const aDue = a.next_billing_date ? new Date(a.next_billing_date).getTime() : Number.POSITIVE_INFINITY;
      const bDue = b.next_billing_date ? new Date(b.next_billing_date).getTime() : Number.POSITIVE_INFINITY;
      if (aDue !== bDue) return aDue - bDue;

      return b.confidence - a.confidence;
    });
  }, [activeSubscriptions]);

  const filteredSubscriptions = useMemo(() => {
    const value = query.trim().toLowerCase();

    return sortedSubscriptions.filter((item) => {
      const filterMatch =
        filter === "all" ||
        (filter === "paid" && (item.type === "paid" || item.cost > 0)) ||
        (filter === "free" && item.type === "free") ||
        (filter === "trial" && (item.type === "free_trial" || item.status === "trial")) ||
        (filter === "review" && needsHumanReview(item));

      if (!filterMatch) return false;
      if (!value) return true;

      const evidenceText = item.evidence
        .map((evidence) => `${evidence.subject || ""} ${evidence.from || ""} ${evidence.snippet || ""} ${evidence.matched_signals.join(" ")}`)
        .join(" ");
      return `${item.provider_name} ${typeLabel(item.type, locale)} ${cycleLabel(item.billing_cycle, locale)} ${evidenceText}`.toLowerCase().includes(value);
    });
  }, [filter, locale, query, sortedSubscriptions]);

  const allEvidence = useMemo(() => {
    return subscriptions.flatMap((subscription) =>
      subscription.evidence.map((evidence, index) => ({
        evidence,
        key: `${subscription.id}-${evidence.message_id || evidence.subject || index}`,
        subscription
      }))
    );
  }, [subscriptions]);

  const paidCount = activeSubscriptions.filter((item) => item.type === "paid" || item.cost > 0).length;
  const freeCount = activeSubscriptions.filter((item) => item.type === "free").length;
  const trialCount = activeSubscriptions.filter((item) => item.type === "free_trial" || item.status === "trial").length;
  const dueSoonCount = activeSubscriptions.filter(isDueSoon).length;
  const reviewCount = activeSubscriptions.filter(needsHumanReview).length;
  const evidenceCount = allEvidence.length;
  const averageConfidence = activeSubscriptions.length
    ? Math.round((activeSubscriptions.reduce((total, item) => total + item.confidence, 0) / activeSubscriptions.length) * 100)
    : 0;
  const nextSubscription = activeSubscriptions
    .filter((item) => item.next_billing_date || item.trial_ends_at)
    .sort((a, b) => String(a.trial_ends_at || a.next_billing_date).localeCompare(String(b.trial_ends_at || b.next_billing_date)))[0];

  async function refreshAfter(action: () => Promise<unknown>) {
    setError(null);
    await action();
    await load();
  }

  async function handleSync() {
    await runDashboardSync();
  }

  async function handleSyncAll() {
    setSyncingAll(true);
    setError(null);
    setNotice(null);

    try {
      await readJson<{ ok: true }>("/api/connectors/sync-all", { method: "POST" });
      await load();
      setNotice("Автоматический поиск завершен.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось запустить автоматический поиск.");
    } finally {
      setSyncingAll(false);
    }
  }

  async function handleConnectBank() {
    setError(null);
    try {
      const response = await fetch("/api/connectors/bank/start");
      if (response.redirected) {
        window.location.href = response.url;
        return;
      }
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Bank auto-connect is not configured.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Bank auto-connect is not configured.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await refreshAfter(() => readJson<{ ok: true }>(`/api/subscriptions/${id}`, { method: "DELETE" }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.error);
    }
  }

  async function handleCancelSubscription(subscription: Subscription) {
    setCancellingSubscriptionId(subscription.id);
    setError(null);
    setNotice(null);

    try {
      const response = await readJson<CancelSubscriptionResponse>(`/api/subscriptions/${subscription.id}/cancel`, { method: "POST" });
      if (response.result.status === "needs_user_action") {
        window.open(response.result.cancellation_path, "_blank", "noopener,noreferrer");
        setNotice(`${subscription.provider_name}: ${t.needsUserActionCancel}. ${t.systemCancelNote}`);
      } else if (response.result.status === "auto_cancelled") {
        setNotice(`${subscription.provider_name}: ${t.autoCancelled}.`);
        await load();
      } else {
        setNotice(`${subscription.provider_name}: ${t.unsupportedCancel}. ${response.result.reason}`);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.error);
    } finally {
      setCancellingSubscriptionId(null);
    }
  }

  async function handleMarkCancelled(subscription: Subscription) {
    setMarkingCancelledId(subscription.id);
    setError(null);
    setNotice(null);

    try {
      await readJson<{ ok: true; subscription: Subscription }>(`/api/subscriptions/${subscription.id}/cancelled`, { method: "POST" });
      await load();
      setNotice(`${subscription.provider_name}: ${t.cancelConfirmed}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.error);
    } finally {
      setMarkingCancelledId(null);
    }
  }

  async function handleTelegramTest() {
    setTelegramTesting(true);
    setError(null);
    setNotice(null);

    try {
      await readJson<{ ok: true }>("/api/telegram/test", { method: "POST" });
      await load();
      setNotice(t.telegramSent);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : t.error;
      setError(message === "Telegram is not connected yet" ? "Сначала нажмите «Подключить Telegram», откройте бота и нажмите Start." : message);
    } finally {
      setTelegramTesting(false);
    }
  }

  function stopTelegramPolling() {
    if (telegramPollTimerRef.current) {
      window.clearInterval(telegramPollTimerRef.current);
      telegramPollTimerRef.current = null;
    }
  }

  function handleTelegramConnect() {
    setError(null);
    setNotice("Открыл Telegram. Нажмите Start в TengeGuardbot, а сайт сам проверит подключение.");

    const opened = window.open("/api/telegram/connect", "_blank", "noopener,noreferrer");
    if (!opened) {
      window.location.href = "/api/telegram/connect";
      return;
    }

    stopTelegramPolling();
    let attempts = 0;

    const checkConnection = async () => {
      attempts += 1;
      try {
        const telegram = await readJson<TelegramStatus>("/api/telegram/status");
        setTelegramStatus(telegram);
        if (telegram.connected) {
          stopTelegramPolling();
          setNotice("Telegram подключён. Теперь бот сможет присылать уведомления по подпискам.");
        }
      } catch {
        // The next polling tick will retry. The visible flow should stay calm.
      }

      if (attempts >= 60) {
        stopTelegramPolling();
      }
    };

    window.setTimeout(checkConnection, 1500);
    telegramPollTimerRef.current = window.setInterval(checkConnection, 3000);
  }

  async function handleAiSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = aiInput.trim();
    if (!question || aiSending) return;

    const nextMessages: AiMessage[] = [...aiMessages, { role: "user", content: question }];
    setAiMessages(nextMessages);
    setAiInput("");
    setAiSending(true);
    setError(null);

    try {
      const response = await readJson<AiChatResponse>("/api/ai-chat", {
        method: "POST",
        body: JSON.stringify({
          messages: nextMessages.slice(-10)
        })
      });
      setAiMessages((current) => [...current, { role: "assistant", content: response.answer }]);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : t.error;
      setAiMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: message
        }
      ]);
    } finally {
      setAiSending(false);
    }
  }

  async function handleChangeAccount() {
    setError(null);
    await readJson<{ ok: true }>("/api/subcut/gmail/logout", { method: "POST" }).catch(() => null);
    window.location.href = "/auth/gmail";
  }

  async function handleLogout() {
    setError(null);
    await readJson<{ ok: true }>("/api/subcut/gmail/logout", { method: "POST" }).catch(() => null);
    window.location.href = "/";
  }

  function handleConnect() {
    const connectUrl = "/api/subcut/gmail/start";

    if (!status?.connected && !canStartGoogleOAuth) {
      window.location.href = "/setup/google";
      return;
    }

    setGoogleSigningIn(true);
    setAuthStage("consent");
    setError(null);
    window.location.href = connectUrl;
  }

  function navigateView(view: DashboardView) {
    setActiveView(view);
    window.location.href =
      view === "subscriptions"
        ? "/dashboard/subscriptions"
        : view === "evidence"
          ? "/dashboard/evidence"
          : view === "access"
            ? "/dashboard/access"
            : view === "history"
              ? "/dashboard/history"
              : view === "ai"
                ? "/dashboard/ai"
                : view === "account"
                  ? "/dashboard/account"
              : "/dashboard";
  }

  const navItems: Array<{ view: DashboardView; label: string; icon: React.ElementType }> = [
    { view: "dashboard", label: t.overview, icon: Radar },
    { view: "subscriptions", label: t.subscriptionsNav, icon: Database },
    { view: "evidence", label: t.evidenceNav, icon: MailCheck },
    { view: "access", label: t.accessNav, icon: KeyRound },
    { view: "history", label: t.historyNav, icon: CalendarDays },
    { view: "ai", label: t.aiNav, icon: Bot },
    { view: "account", label: t.accountNav, icon: UserCog }
  ];

  return (
    <main className={`${isMobileMode ? "bg-slate-100" : "tg-shell-grid bg-background"} min-h-screen text-on-surface antialiased`}>
      <div className={isMobileMode ? "mx-auto min-h-screen max-w-md border-x border-outline-variant bg-background pb-24 shadow-2xl shadow-slate-200/70" : "min-h-screen pb-24 lg:flex lg:pb-0"}>
        {!isMobileMode ? (
          <aside className="hidden min-h-screen w-72 shrink-0 flex-col border-r border-outline-variant bg-surface-container-low/95 px-4 py-6 backdrop-blur-xl lg:flex">
            <button className="mb-8 flex min-w-0 items-center gap-3 rounded-xl border border-outline-variant bg-white p-3 text-left shadow-stitch" onClick={() => navigateView("dashboard")} type="button">
              <BrandMark />
              <div className="min-w-0">
                <h1 className="whitespace-nowrap font-display text-headline-md font-extrabold leading-7 text-on-surface">TengeGuard</h1>
                <p className="whitespace-nowrap text-label-sm font-semibold leading-5 text-on-surface-variant">Fintech Security</p>
              </div>
            </button>
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => (
                <button
                  className={`flex w-full min-w-0 items-center gap-3 rounded-lg px-4 py-3 text-left text-label-sm font-bold leading-5 transition active:scale-[0.98] ${
                    activeView === item.view ? "bg-primary text-on-primary shadow-stitch" : "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
                  }`}
                  key={item.view}
                  onClick={() => navigateView(item.view)}
                  type="button"
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="min-w-0 whitespace-nowrap">{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="mt-6 rounded-xl border border-outline-variant bg-white p-4 shadow-stitch">
              <div className="flex items-center gap-3 text-label-sm font-bold text-on-surface">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10">
                  <Laptop className="h-4 w-4 text-primary" />
                </div>
                <span className="break-words">Режим ноутбука</span>
              </div>
              <p className="mt-3 text-[12px] leading-5 text-on-surface-variant">Широкий dashboard с аналитикой и быстрым доступом к разделам.</p>
              <a className="mt-3 inline-flex text-label-sm font-bold text-primary hover:underline" href="/">
                Сменить режим
              </a>
            </div>
          </aside>
        ) : null}

        <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-50 border-b border-outline-variant bg-surface/90 backdrop-blur-xl">
        <div className={`mx-auto flex h-16 items-center gap-4 px-4 ${isMobileMode ? "max-w-md justify-between" : "max-w-[1280px] justify-end sm:px-6 lg:px-10"}`}>
          <button className="flex shrink-0 items-center gap-3 lg:hidden" onClick={() => navigateView("dashboard")} type="button">
            <BrandMark />
            <div className="min-w-0 text-left">
              <h1 className="whitespace-nowrap font-display text-headline-md font-bold leading-7 text-primary">TengeGuard</h1>
              <p className="hidden text-[11px] font-semibold text-on-surface-variant sm:block">{t.activeProtection}</p>
            </div>
          </button>

          {!isMobileMode ? (
            <label className="relative hidden max-w-xl flex-1 lg:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                className="h-10 w-full rounded-full border border-outline-variant bg-surface-container-low pl-10 pr-4 text-body-md font-medium outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/10"
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.search}
                value={query}
              />
            </label>
          ) : null}

          <div className="flex shrink-0 items-center gap-3">
            {isMobileMode ? (
              <a className="grid h-10 w-10 place-items-center rounded-full border border-outline-variant bg-surface-container-low text-primary" href="/" aria-label="Сменить режим">
                <Smartphone className="h-5 w-5" />
              </a>
            ) : null}
            <span
              className={`hidden whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-bold sm:inline-flex ${
                status?.connected ? "border-emerald-200 bg-emerald-soft text-emerald-dark" : "border-amber-200 bg-amber-soft text-amber-dark"
              }`}
            >
              {status?.connected ? t.googleConnected : t.googleDisconnected}
            </span>
            <label className="relative">
              <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <select
                className="h-10 appearance-none rounded-lg border border-outline-variant bg-surface pl-9 pr-8 text-label-sm font-bold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                onChange={(event) => setLocale(event.target.value as Locale)}
                value={locale}
              >
                {(["ru", "en", "kk"] as Locale[]).map((item) => (
                  <option key={item} value={item}>
                    {localeLabels[item]}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-outline-variant bg-surface-container-high">
              {status?.user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="h-full w-full object-cover" src={status.user.avatar_url} />
              ) : (
                <UserCircle2 className="h-5 w-5 text-primary" />
              )}
            </div>
          </div>
        </div>
      </header>

      <div className={`mx-auto px-4 py-8 ${isMobileMode ? "max-w-md" : "max-w-[1280px] sm:px-6 lg:px-10"}`}>
        {error ? (
          <NoticeCard tone="error" title={t.error} body={error} />
        ) : null}
        {notice ? (
          <NoticeCard tone="success" title="TengeGuard" body={notice} />
        ) : null}

        {isPreparingDashboard ? (
          <MagicProgress locale={locale} stepIndex={progressStep} />
        ) : (
          <>
            {activeView === "dashboard" ? (
              <section className={isMobileMode ? "space-y-6" : "grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"}>
                <div className="space-y-6">
                  <FinancialSummary
                    locale={locale}
                    monthlyTotal={currencyTotals(activeSubscriptions) || "0"}
                    nextLabel={nextSubscription ? `${nextSubscription.provider_name} · ${dateLabel(nextSubscription.trial_ends_at || nextSubscription.next_billing_date, locale)}` : "—"}
                  />

                  <GoogleStatusCard
                    connected={Boolean(status?.connected)}
                    disabled={loading || syncing || googleSigningIn}
                    lastScan={status?.report?.scanned_at ? formatDate(status.report.scanned_at, locale) : "—"}
                    onConnect={handleConnect}
                    onScan={handleSync}
                    scanLabel={syncing ? t.scanning : t.scanNow}
                    t={t}
                    unavailable={googleSignInUnavailable}
                  />

                  <TrustCard
                    evidenceCount={evidenceCount}
                    messagesScanned={status?.report?.messages_scanned || 0}
                    t={t}
                  />
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    <MetricTile icon={Database} label={t.activeSubscriptions} value={String(activeSubscriptions.length)} />
                    <MetricTile icon={CalendarDays} label={t.endingSoon} value={String(dueSoonCount)} tone="amber" />
                    <MetricTile icon={AlertTriangle} label={t.needsReview} value={String(reviewCount)} tone="rose" />
                    <MetricTile icon={CheckCircle2} label={t.confidence} value={`${averageConfidence}%`} tone="emerald" />
                  </div>

                  <TelegramCard
                    connected={Boolean(telegramStatus?.connected)}
                    configured={Boolean(telegramStatus?.configured)}
                    onConnect={handleTelegramConnect}
                    onTest={handleTelegramTest}
                    testing={telegramTesting}
                    t={t}
                  />

                  <button
                    className="flex w-full min-w-0 items-start justify-between gap-4 rounded-xl border border-outline-variant bg-white p-5 text-left shadow-stitch transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
                    onClick={() => navigateView("subscriptions")}
                    type="button"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-headline-md text-headline-md leading-7">{t.subscriptionsNav}</p>
                      <p className="mt-1 break-words text-body-md leading-6 text-on-surface-variant">{t.subscriptionsText}</p>
                    </div>
                    <ExternalLink className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  </button>
                </div>
              </section>
            ) : null}

            {activeView === "subscriptions" ? (
              <section className="space-y-6">
                <PageHeading eyebrow={t.subscriptionsNav} title={t.subscriptionsTitle} body={t.subscriptionsText} />
                <SubscriptionGraph subscriptions={filteredSubscriptions} locale={locale} />

                <div className="rounded-xl border border-outline-variant bg-white p-4 shadow-stitch">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <label className="relative w-full lg:max-w-xl">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-10 pr-3 text-body-md font-medium outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/10"
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t.search}
                        value={query}
                      />
                    </label>
                    <p className="text-label-sm font-semibold text-on-surface-variant">
                      {t.showing}: {filteredSubscriptions.length}/{activeSubscriptions.length} · {status?.report?.query_count || 0} {t.queries}
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    {(["all", "paid", "free", "trial", "review"] as DashboardFilter[]).map((item) => (
                      <button
                        className={`shrink-0 rounded-full px-5 py-2 text-label-sm font-bold transition ${
                          filter === item
                            ? "bg-primary text-on-primary shadow-stitch"
                            : "border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container"
                        }`}
                        key={item}
                        onClick={() => setFilter(item)}
                        type="button"
                      >
                        {filterLabel(item, locale)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredSubscriptions.length ? (
                    filteredSubscriptions.map((item) => (
                      <SubscriptionCard
                        cancelling={cancellingSubscriptionId === item.id}
                        item={item}
                        key={item.id}
                        locale={locale}
                        markingCancelled={markingCancelledId === item.id}
                        onCancel={() => handleCancelSubscription(item)}
                        onDelete={() => handleDelete(item.id)}
                        onMarkCancelled={() => handleMarkCancelled(item)}
                        t={t}
                      />
                    ))
                  ) : (
                    <EmptyState icon={PlugZap} title={t.noSubsTitle} body={t.noSubsText} />
                  )}
                </div>
              </section>
            ) : null}

            {activeView === "evidence" ? (
              <section className="space-y-6">
                <PageHeading eyebrow={t.evidenceNav} title={t.evidenceTitle} body={t.evidenceText} />
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricTile icon={MailCheck} label={t.evidence} value={String(evidenceCount)} tone="emerald" />
                  <MetricTile icon={CheckCircle2} label={t.confidence} value={`${averageConfidence}%`} />
                  <MetricTile icon={LockKeyhole} label={t.readOnly} value="Gmail" tone="amber" />
                </div>
                <div className="rounded-xl border border-outline-variant bg-white p-4 shadow-stitch">
                  <div className="flex items-start gap-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-label-sm font-bold text-primary">{t.verifiedData}</h3>
                      <p className="mt-1 text-body-md text-on-surface-variant">{t.privacy}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {allEvidence.length ? (
                    allEvidence.map(({ evidence, key, subscription }) => (
                      <EvidenceCard evidence={evidence} item={subscription} key={key} locale={locale} t={t} />
                    ))
                  ) : (
                    <EmptyState icon={MailCheck} title={t.evidenceTitle} body={t.noSubsText} />
                  )}
                </div>
              </section>
            ) : null}

            {activeView === "access" ? (
              <section className="space-y-6">
                <PageHeading eyebrow={t.accessNav} title={t.accessTitle} body={t.accessText} />
                <div className="grid gap-4 lg:grid-cols-2">
                  <AccessCard
                    action={status?.connected ? t.reconnectGoogle : t.continueGoogle}
                    body={t.privacy}
                    disabled={loading || googleSigningIn}
                    icon={UserCircle2}
                    meta={status?.user?.email || "gmail.readonly"}
                    onAction={handleConnect}
                    status={status?.connected ? t.googleConnected : t.googleDisconnected}
                    title="Google Gmail"
                    tone={status?.connected ? "emerald" : "amber"}
                  />
                  <AccessCard
                    action={telegramStatus?.connected ? t.telegramTest : t.telegramConnect}
                    body={t.telegramText}
                    disabled={!telegramStatus?.configured || telegramTesting}
                    icon={BellRing}
                    meta={telegramStatus?.botUsername ? `@${telegramStatus.botUsername}` : "TengeGuard Bot"}
                    onAction={telegramStatus?.connected ? handleTelegramTest : handleTelegramConnect}
                    status={telegramStatus?.connected ? "connected" : "not connected"}
                    title={t.telegramTitle}
                    tone={telegramStatus?.connected ? "emerald" : "sky"}
                  />
                </div>

                <div className="rounded-xl border border-outline-variant bg-white p-5 shadow-stitch">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="font-headline-md text-headline-md">{t.syncAll}</h3>
                      <p className="mt-1 text-body-md text-on-surface-variant">{t.accessText}</p>
                    </div>
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-label-sm font-bold text-on-primary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={syncingAll}
                      onClick={handleSyncAll}
                      type="button"
                    >
                      {syncingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
                      {syncingAll ? t.syncingAll : t.syncAll}
                    </button>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {connectors.map((connector) => (
                      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 transition hover:-translate-y-0.5 hover:shadow-soft" key={connector.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-on-surface">{connector.name}</p>
                            <p className="mt-2 text-[12px] leading-5 text-on-surface-variant">{connector.coverage}</p>
                          </div>
                          <StatusBadge status={connector.status} />
                        </div>
                        {connector.id === "bank" ? (
                          <button
                            className="mt-4 w-full rounded-lg bg-inverse-surface px-3 py-2 text-label-sm font-bold text-inverse-on-surface transition hover:bg-on-surface"
                            onClick={handleConnectBank}
                            type="button"
                          >
                            {connector.action || t.connectBank}
                          </button>
                        ) : (
                          <p className="mt-4 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-[12px] font-semibold text-on-surface-variant">
                            {connector.setup || connector.action}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            {activeView === "history" ? (
              <section className="space-y-6">
                <PageHeading eyebrow={t.historyNav} title={`${t.currentSubscriptions} / ${t.cancelledSubscriptions}`} body={t.systemCancelNote} />
                <div className="grid gap-5 lg:grid-cols-2">
                  <HistoryColumn empty={t.noSubsText} items={activeSubscriptions} locale={locale} title={t.currentSubscriptions} />
                  <HistoryColumn empty={t.cancelledEmpty} items={cancelledSubscriptions} locale={locale} title={t.cancelledSubscriptions} cancelled />
                </div>
              </section>
            ) : null}

            {activeView === "ai" ? (
              <section className="space-y-6">
                <PageHeading eyebrow={t.aiNav} title={t.aiTitle} body={t.aiText} />
                <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
                  <section className="flex min-h-[620px] flex-col rounded-xl border border-outline-variant bg-white shadow-stitch">
                    <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-on-primary">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-headline-md text-headline-md">{t.aiTitle}</h3>
                          <p className="text-label-sm text-on-surface-variant">Gmail context + subscription intelligence</p>
                        </div>
                      </div>
                      {aiSending ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : null}
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto p-4">
                      {aiMessages.map((message, index) => (
                        <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`} key={`${message.role}-${index}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-body-md leading-6 ${
                              message.role === "user"
                                ? "bg-primary text-on-primary"
                                : "border border-outline-variant bg-surface-container-low text-on-surface"
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      ))}
                    </div>

                    <form className="border-t border-outline-variant p-4" onSubmit={handleAiSubmit}>
                      <div className="flex gap-3">
                        <input
                          className="min-h-12 flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-body-md outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/10"
                          disabled={aiSending}
                          onChange={(event) => setAiInput(event.target.value)}
                          placeholder={t.aiPlaceholder}
                          value={aiInput}
                        />
                        <button
                          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-label-sm font-bold text-on-primary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={aiSending || !aiInput.trim()}
                          type="submit"
                        >
                          {aiSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          <span className="hidden sm:inline">{t.aiSend}</span>
                        </button>
                      </div>
                    </form>
                  </section>

                  <aside className="space-y-4">
                    <MetricTile icon={Database} label={t.activeSubscriptions} value={String(activeSubscriptions.length)} />
                    <MetricTile icon={CalendarDays} label={t.endingSoon} value={String(dueSoonCount)} tone="amber" />
                    <div className="rounded-xl border border-outline-variant bg-white p-5 shadow-stitch">
                      <h4 className="text-label-sm font-bold uppercase text-on-surface-variant">Что можно спросить</h4>
                      <div className="mt-4 space-y-2">
                        {[
                          "Какие подписки выглядят рискованно?",
                          "Что скоро закончится?",
                          "Как улучшить стартап TengeGuard?",
                          "Как объяснить пользователю free trial?"
                        ].map((prompt) => (
                          <button
                            className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-left text-label-sm font-semibold text-on-surface-variant transition hover:border-primary hover:text-primary"
                            key={prompt}
                            onClick={() => setAiInput(prompt)}
                            type="button"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </aside>
                </div>
              </section>
            ) : null}

            {activeView === "account" ? (
              <section className="space-y-6">
                <PageHeading eyebrow={t.accountNav} title={t.accountTitle} body={t.accountText} />
                <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                  <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-stitch">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                      <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-xl border border-outline-variant bg-surface-container-high">
                        {status?.user?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt="" className="h-full w-full object-cover" src={status.user.avatar_url} />
                        ) : (
                          <UserCircle2 className="h-10 w-10 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-display text-headline-lg-mobile font-bold text-on-surface">{status?.user?.name || "TengeGuard user"}</h3>
                        <p className="mt-1 text-body-md text-on-surface-variant">{status?.user?.email || "Google account"}</p>
                        <span
                          className={`mt-3 inline-flex rounded-full border px-3 py-1 text-label-sm font-bold ${
                            status?.connected ? "border-emerald-200 bg-emerald-soft text-emerald-dark" : "border-amber-200 bg-amber-soft text-amber-dark"
                          }`}
                        >
                          {status?.connected ? t.googleConnected : t.googleDisconnected}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <AccountAction icon={RefreshCw} label={t.reconnectGoogle} onClick={handleConnect} />
                      <AccountAction icon={UserCog} label={t.changeAccount} onClick={handleChangeAccount} />
                      <AccountAction icon={Smartphone} label={t.changeMode} onClick={() => (window.location.href = "/")} />
                      <AccountAction danger icon={LogOut} label={t.logout} onClick={handleLogout} />
                    </div>
                  </section>

                  <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-stitch">
                    <h3 className="font-headline-md text-headline-md">{t.accessTitle}</h3>
                    <div className="mt-5 space-y-3">
                      <AccountStatus label="Gmail" value={status?.connected ? t.googleConnected : t.googleDisconnected} tone={status?.connected ? "emerald" : "amber"} />
                      <AccountStatus label="Telegram" value={telegramStatus?.connected ? "connected" : "not connected"} tone={telegramStatus?.connected ? "emerald" : "amber"} />
                      <AccountStatus label="Interface" value={isMobileMode ? "mobile" : "desktop"} tone="primary" />
                      <AccountStatus label="Last scan" value={status?.report?.scanned_at ? formatDate(status.report.scanned_at, locale) : "—"} tone="primary" />
                    </div>
                  </section>
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>

      <nav
        className={`fixed bottom-0 z-50 flex h-16 items-center gap-1 overflow-x-auto border-t border-outline-variant bg-surface px-2 ${
          isMobileMode ? "left-1/2 w-full max-w-md -translate-x-1/2" : "left-0 w-full md:hidden"
        }`}
      >
        {navItems.map((item) => (
          <button
            className={`flex h-full min-w-[72px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-bold leading-3 transition active:scale-95 ${
              activeView === item.view ? "text-primary" : "text-on-surface-variant"
            }`}
            key={item.view}
            onClick={() => navigateView(item.view)}
            type="button"
          >
            <item.icon className="h-5 w-5" />
            <span className="max-w-full whitespace-normal break-words text-center">{item.label}</span>
          </button>
        ))}
      </nav>
        </div>
      </div>
    </main>
  );
}

function BrandMark() {
  return (
    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-outline-variant bg-white shadow-stitch">
      <BrandAvatar />
    </div>
  );
}

function BrandAvatar({ className = "h-full w-full" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="TengeGuard" className={`${className} object-cover`} src="/tengeguard-mark.jpg" />
  );
}

function NoticeCard({ tone, title, body }: { tone: "success" | "error"; title: string; body: string }) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-soft text-emerald-dark"
      : "border-red-200 bg-red-50 text-red-700";
  return (
    <div className={`mb-4 rounded-xl border p-4 text-body-md font-semibold ${toneClass}`}>
      <p className="font-bold">{title}</p>
      <p className="mt-1">{body}</p>
    </div>
  );
}

function AccountAction({
  danger = false,
  icon: Icon,
  label,
  onClick
}: {
  danger?: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-label-sm font-bold transition ${
        danger
          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          : "border-outline-variant bg-surface-container-low text-on-surface hover:border-primary hover:text-primary"
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function AccountStatus({ label, tone, value }: { label: string; tone: "primary" | "emerald" | "amber"; value: string }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-soft text-emerald-dark",
    amber: "bg-amber-soft text-amber-dark"
  };

  return (
    <div className="flex min-w-0 items-start justify-between gap-4 rounded-xl border border-outline-variant bg-surface px-4 py-3">
      <span className="min-w-0 break-words text-label-sm font-bold leading-5 text-on-surface-variant">{label}</span>
      <span className={`shrink-0 rounded-full px-3 py-1 text-label-sm font-bold leading-5 ${tones[tone]}`}>{value}</span>
    </div>
  );
}

function PageHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <section className="min-w-0 space-y-3">
      <p className="flex min-w-0 items-center gap-2 text-label-sm font-bold uppercase leading-5 tracking-wide text-on-surface-variant">
        <span className="h-px w-8 bg-outline-variant" />
        <span className="min-w-0 break-words">{eyebrow}</span>
      </p>
      <h2 className="max-w-4xl break-words font-display text-headline-lg-mobile font-bold leading-8 text-on-surface sm:text-headline-lg">{title}</h2>
      <p className="max-w-3xl text-body-md leading-7 text-on-surface-variant">{body}</p>
    </section>
  );
}

function FinancialSummary({ monthlyTotal, nextLabel, locale }: { monthlyTotal: string; nextLabel: string; locale: Locale }) {
  const t = copy[locale];
  return (
    <section className="relative overflow-hidden rounded-xl border border-outline-variant bg-white p-6 shadow-stitch">
      <WalletCards className="absolute right-5 top-5 h-16 w-16 text-primary/10" />
      <div className="relative z-10">
        <p className="mb-1 text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">{t.totalMonthlySpend}</p>
        <h2 className="font-display text-[34px] font-bold text-primary sm:text-display">{monthlyTotal}</h2>
        <div className="mt-4 flex w-fit max-w-full items-start gap-2 rounded-lg border border-outline-variant/60 bg-surface-container-low px-3 py-2">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-amber-dark" />
          <span className="min-w-0 break-words text-label-sm font-semibold leading-5 text-on-surface">
            {t.nextBilling}: <span className="font-bold">{nextLabel}</span>
          </span>
        </div>
      </div>
    </section>
  );
}

function GoogleStatusCard({
  connected,
  disabled,
  lastScan,
  onConnect,
  onScan,
  scanLabel,
  t,
  unavailable
}: {
  connected: boolean;
  disabled: boolean;
  lastScan: string;
  onConnect: () => void;
  onScan: () => void;
  scanLabel: string;
  t: (typeof copy)["ru"];
  unavailable: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-stitch">
      <div className="flex items-center justify-between border-b border-outline-variant/70 p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-container">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-label-sm font-bold text-on-surface">{connected ? t.googleConnected : t.googleDisconnected}</h3>
            <p className="mt-1 flex items-center gap-1 text-[11px] leading-4 text-on-surface-variant">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${connected ? "bg-emerald-accent" : "bg-amber-400"}`} />
              {connected ? t.activeConnection : unavailable ? t.serverMissing : "OAuth"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase text-on-surface-variant">{t.lastScan}</p>
          <p className="text-label-sm font-semibold text-on-surface">{lastScan}</p>
        </div>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-label-sm font-bold text-on-primary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          onClick={onConnect}
          type="button"
        >
          <UserCircle2 className="h-4 w-4" />
          {connected ? t.reconnectGoogle : t.continueGoogle}
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-accent px-4 py-3 text-label-sm font-bold text-white transition hover:bg-emerald-dark disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled || !connected}
          onClick={onScan}
          type="button"
        >
          {disabled && connected ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {scanLabel}
        </button>
      </div>
    </section>
  );
}

function TrustCard({ evidenceCount, messagesScanned, t }: { evidenceCount: number; messagesScanned: number; t: (typeof copy)["ru"] }) {
  return (
    <section className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-white p-5 shadow-stitch">
      <div className="min-w-0">
        <h4 className="text-label-sm font-bold text-on-surface">{t.realEvidenceOnly}</h4>
        <p className="mt-1 break-words text-label-sm leading-5 text-on-surface-variant">
          {messagesScanned} {t.messages.toLowerCase()} · {evidenceCount} {t.evidence.toLowerCase()}
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-outline-variant/50 bg-surface-container px-2 py-1 text-[10px] font-bold uppercase text-on-surface-variant">
          <LockKeyhole className="h-3.5 w-3.5" />
          {t.readOnly}
        </span>
      </div>
      <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-emerald-accent/30">
        <ShieldCheck className="h-6 w-6 text-emerald-accent" />
        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-accent/10" />
      </div>
    </section>
  );
}

function TelegramCard({
  connected,
  configured,
  onConnect,
  onTest,
  testing,
  t
}: {
  connected: boolean;
  configured: boolean;
  onConnect: () => void;
  onTest: () => void;
  testing: boolean;
  t: (typeof copy)["ru"];
}) {
  return (
    <section className="overflow-hidden rounded-xl bg-inverse-surface p-5 text-inverse-on-surface shadow-stitch">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white shadow-stitch">
          <BrandAvatar />
        </div>
        <div className="min-w-0">
          <h4 className="break-words text-body-md font-extrabold leading-6">{t.telegramTitle}</h4>
          <p className="mt-1 max-w-md break-words text-label-sm leading-5 opacity-75">{t.telegramText}</p>
          <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${connected ? "bg-emerald-accent text-white" : "bg-white/10 text-inverse-on-surface"}`}>
            {connected ? "connected" : configured ? "ready" : "not configured"}
          </span>
        </div>
      </div>
      <button
        className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-xs font-bold leading-5 text-primary transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        disabled={!configured || testing}
        onClick={connected ? onTest : onConnect}
        type="button"
      >
        {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {connected ? t.telegramTest : t.telegramConnect}
      </button>
      </div>
    </section>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  tone = "primary"
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone?: "primary" | "emerald" | "amber" | "rose";
}) {
  const tones = {
    primary: "text-primary",
    emerald: "text-emerald-accent",
    amber: "text-amber-dark",
    rose: "text-red-600"
  };
  return (
    <div className="flex aspect-square flex-col justify-between rounded-xl border border-outline-variant bg-white p-4 shadow-stitch transition hover:-translate-y-0.5 hover:shadow-soft">
      <Icon className={`h-7 w-7 ${tones[tone]}`} />
      <div>
        <h4 className="font-display text-2xl font-bold text-on-surface">{value}</h4>
        <p className="break-words text-[11px] font-bold uppercase leading-4 text-on-surface-variant">{label}</p>
      </div>
    </div>
  );
}

function SubscriptionGraph({ subscriptions, locale }: { subscriptions: Subscription[]; locale: Locale }) {
  const t = copy[locale];
  const paid = subscriptions.filter((item) => item.type === "paid" || item.cost > 0).length;
  const free = subscriptions.filter((item) => item.type === "free").length;
  const trial = subscriptions.filter((item) => item.type === "free_trial" || item.status === "trial").length;
  const monthlyTotal = currencyTotals(subscriptions) || "0";

  return (
    <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-stitch">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-label-sm font-bold uppercase text-on-surface-variant">Portfolio mix</p>
          <h3 className="font-headline-md text-headline-md text-on-surface">{t.subscriptionsTitle}</h3>
        </div>
        <span className="w-fit rounded-full bg-surface-container px-3 py-1 text-label-sm font-bold text-on-surface-variant">
          {subscriptions.length} total
        </span>
      </div>
      <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:items-center">
        <div className="relative mx-auto h-56 w-56">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" fill="transparent" r="40" stroke="hsl(var(--surface-container))" strokeWidth="12" />
            <circle cx="50" cy="50" fill="transparent" r="40" stroke="hsl(var(--primary))" strokeDasharray="180 251.2" strokeLinecap="round" strokeWidth="12" />
            <circle cx="50" cy="50" fill="transparent" r="40" stroke="#10b981" strokeDasharray="52 251.2" strokeDashoffset="-188" strokeLinecap="round" strokeWidth="12" />
            <circle cx="50" cy="50" fill="transparent" r="40" stroke="#f59e0b" strokeDasharray="28 251.2" strokeDashoffset="-248" strokeLinecap="round" strokeWidth="12" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-display text-headline-lg font-bold">{monthlyTotal}</span>
            <span className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">{t.totalMonthlySpend}</span>
          </div>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-3">
          <LegendDot color="bg-primary" label={t.paid} value={paid} />
          <LegendDot color="bg-emerald-accent" label={t.free} value={free} />
          <LegendDot color="bg-amber-400" label={t.trials} value={trial} />
        </div>
      </div>
    </section>
  );
}

function LegendDot({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
      <div className="flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${color}`} />
        <span className="text-label-sm font-semibold text-on-surface-variant">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-on-surface">{value}</p>
    </div>
  );
}

function SubscriptionCard({
  cancelling,
  item,
  locale,
  markingCancelled,
  onCancel,
  onDelete,
  onMarkCancelled,
  t
}: {
  cancelling: boolean;
  item: Subscription;
  locale: Locale;
  markingCancelled: boolean;
  onCancel: () => void;
  onDelete: () => void;
  onMarkCancelled: () => void;
  t: (typeof copy)["ru"];
}) {
  const confidence = Math.round(item.confidence * 100);
  const review = needsHumanReview(item);
  const badgeClass =
    item.type === "paid" || item.cost > 0
      ? "bg-emerald-soft text-emerald-dark"
      : item.type === "free_trial" || item.status === "trial"
        ? "bg-amber-soft text-amber-dark"
        : "bg-surface-container text-on-surface-variant";
  const barClass = review ? "bg-amber-500" : "bg-emerald-500";

  return (
    <article className="rounded-xl border border-outline-variant bg-white p-5 shadow-stitch transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-outline-variant bg-surface-container-low">
            <span className="font-display text-lg font-black text-primary">{item.provider_name.slice(0, 1).toUpperCase()}</span>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md">{item.provider_name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight ${badgeClass}`}>
                {typeLabel(item.type, locale)}
              </span>
              <span className={`text-label-sm ${review ? "font-semibold text-amber-dark" : "text-on-surface-variant"}`}>
                {dateLabel(item.trial_ends_at || item.next_billing_date, locale)}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono-data text-body-lg font-bold">{priceLabel(item, locale)}</p>
          <p className="text-[10px] font-semibold text-on-surface-variant">{cycleLabel(item.billing_cycle, locale)}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-surface-container-low p-2.5">
        <CheckCircle2 className="h-4 w-4 text-on-surface-variant" />
        <span className="text-label-sm font-semibold text-on-surface-variant">
          {item.evidence.length} Gmail proofs found
        </span>
      </div>

      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-on-surface-variant">{t.trustScore}</span>
          <span className={`text-label-sm font-semibold ${review ? "text-amber-dark" : "text-emerald-dark"}`}>
            {review ? t.needsReview : "Verified"} ({confidence}%)
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
          <div className={`h-full rounded-full ${barClass}`} style={{ width: `${Math.max(8, confidence)}%` }} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2.5 text-label-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={cancelling}
          onClick={onCancel}
          type="button"
        >
          {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
          {cancelling ? t.cancelling : t.cancel}
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 px-3 py-2.5 text-label-sm font-bold text-emerald-dark transition hover:bg-emerald-soft disabled:cursor-not-allowed disabled:opacity-60"
          disabled={markingCancelled}
          onClick={onMarkCancelled}
          type="button"
        >
          {markingCancelled ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {markingCancelled ? t.markingCancelled : t.markCancelled}
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-3 py-2.5 text-label-sm font-bold text-on-surface-variant transition hover:bg-surface-container"
          onClick={onDelete}
          type="button"
        >
          <Trash2 className="h-4 w-4" />
          {t.remove}
        </button>
      </div>
    </article>
  );
}

function EvidenceCard({
  evidence,
  item,
  locale,
  t
}: {
  evidence: SubscriptionEvidence;
  item: Subscription;
  locale: Locale;
  t: (typeof copy)["ru"];
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-stitch transition hover:border-primary/40">
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-outline-variant bg-surface-container-high">
              <MailCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-headline-md text-[16px]">{item.provider_name}</h4>
              <p className="font-mono-data text-[12px] text-on-surface-variant">{evidence.from || evidenceSourceLabel(evidence.source)}</p>
            </div>
          </div>
          <span className="text-label-sm font-semibold text-on-surface-variant">{formatDate(evidence.date, locale)}</span>
        </div>
        <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3">
          <h5 className="mb-1 text-label-sm font-bold text-primary">{evidence.subject || t.evidence}</h5>
          <p className="text-body-md italic text-on-surface">{evidence.snippet || "No snippet"}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 border-t border-outline-variant bg-surface-container-high/30 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-1 text-label-sm font-semibold text-on-surface-variant">
          <LockKeyhole className="h-3.5 w-3.5" />
          {t.sourceLocked}
        </span>
        <span className="text-label-sm font-semibold text-primary">
          {evidence.matched_signals.map((signal) => signalLabel(signal, locale)).join(", ")}
        </span>
      </div>
    </article>
  );
}

function AccessCard({
  action,
  body,
  disabled,
  icon: Icon,
  meta,
  onAction,
  status,
  title,
  tone
}: {
  action: string;
  body: string;
  disabled: boolean;
  icon: React.ElementType;
  meta: string;
  onAction: () => void;
  status: string;
  title: string;
  tone: "emerald" | "amber" | "sky";
}) {
  const toneClass = {
    emerald: "border-emerald-200 bg-emerald-soft text-emerald-dark",
    amber: "border-amber-200 bg-amber-soft text-amber-dark",
    sky: "border-sky-200 bg-sky-50 text-sky-700"
  }[tone];
  return (
    <article className="rounded-xl border border-outline-variant bg-white p-5 shadow-stitch transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-outline-variant bg-surface-container">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md">{title}</h3>
            <p className="mt-1 text-label-sm font-semibold text-on-surface-variant">{meta}</p>
          </div>
        </div>
        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${toneClass}`}>{status}</span>
      </div>
      <p className="mt-4 text-body-md text-on-surface-variant">{body}</p>
      <button
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-label-sm font-bold text-on-primary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        onClick={onAction}
        type="button"
      >
        {action}
      </button>
    </article>
  );
}

function StatusBadge({ status }: { status: ConnectorStatus["status"] }) {
  const tone =
    status === "connected"
      ? "bg-emerald-soft text-emerald-dark"
      : status === "ready"
        ? "bg-sky-50 text-sky-700"
        : "bg-amber-soft text-amber-dark";
  return <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${tone}`}>{status}</span>;
}

function HistoryColumn({
  cancelled = false,
  empty,
  items,
  locale,
  title
}: {
  cancelled?: boolean;
  empty: string;
  items: Subscription[];
  locale: Locale;
  title: string;
}) {
  return (
    <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-stitch">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-headline-md text-headline-md">{title}</h3>
        <span className="rounded-full bg-surface-container px-2 py-1 text-label-sm font-bold text-on-surface-variant">{items.length}</span>
      </div>
      <div className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <div className={`rounded-xl border p-4 ${cancelled ? "border-emerald-200 bg-emerald-soft" : "border-outline-variant bg-surface-container-lowest"}`} key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-on-surface">{item.provider_name}</p>
                  <p className="mt-1 text-label-sm font-semibold text-on-surface-variant">{typeLabel(item.type, locale)} · {priceLabel(item, locale)}</p>
                  <p className="mt-2 text-[11px] font-semibold text-on-surface-variant">
                    {formatDate(cancelled ? item.cancellation_confirmed_at || item.last_seen_at : item.last_seen_at, locale)}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${cancelled ? "bg-white text-emerald-dark" : "bg-surface text-primary"}`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-outline-variant bg-surface-container-low p-4 text-body-md text-on-surface-variant">{empty}</p>
        )}
      </div>
    </section>
  );
}

function MagicProgress({ locale, stepIndex }: { locale: Locale; stepIndex: number }) {
  const t = copy[locale];
  const boundedStep = Math.min(stepIndex, dashboardProgressSteps.length - 1);
  const progress = [28, 64, 88][boundedStep];

  return (
    <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-stitch">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-label-sm font-bold uppercase tracking-wider text-primary">{t.loadingTitle}</p>
          <h3 className="mt-2 font-headline-md text-headline-md">{dashboardProgressSteps[boundedStep]}</h3>
          <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">{t.loadingText}</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-label-sm font-bold text-primary">
          <Loader2 className="h-5 w-5 animate-spin" />
          {progress}%
        </div>
      </div>
      <div className="mt-6 h-3 overflow-hidden rounded-full bg-surface-container">
        <div className="h-full rounded-full bg-emerald-accent transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body
}: {
  icon: React.ElementType;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-outline-variant bg-white p-8 text-center shadow-stitch lg:col-span-2">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-emerald-200 bg-emerald-soft">
        <Icon className="h-6 w-6 text-emerald-dark" />
      </div>
      <h3 className="mt-3 font-headline-md text-headline-md">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-body-md text-on-surface-variant">{body}</p>
    </div>
  );
}
