"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Landmark,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Settings,
  UserCircle2,
  WalletCards,
  XCircle
} from "lucide-react";

type Locale = "ru" | "en" | "kk";
type DashboardView = "dashboard" | "subscriptions" | "ai" | "account";
type DeviceMode = "mobile" | "desktop";
type BillingPlan = "free" | "pro_monthly" | "pro_yearly";
type SubscriptionStatus = "active" | "cancelled" | "trial" | "review";
type BillingCycle = "monthly" | "yearly" | "weekly" | "unknown";
type Filter = "all" | "paid" | "review";

type User = { id: string; email: string; name: string; avatar_url?: string };
type AuthStatus = {
  connected: boolean;
  user: User | null;
  report?: { scanned_at?: string; messages_scanned?: number; subscriptions_found?: number } | null;
};
type TelegramStatus = {
  configured: boolean;
  connected: boolean;
  botUsername?: string;
  connectUrl?: string | null;
  chat?: { username?: string; first_name?: string } | null;
};
type Connector = {
  id: "bank";
  name: string;
  status: "connected" | "ready" | "setup_required" | "not_available";
  coverage: string;
  action: string;
  setup?: string;
};
type Readiness = { paymentConfigured: boolean; persistentStoreConfigured: boolean };
type Evidence = {
  source: string;
  message_id?: string;
  subject?: string;
  from?: string;
  date?: string;
  snippet?: string;
  matched_signals: string[];
};
type Subscription = {
  id: string;
  provider_name: string;
  cost: number;
  currency: string;
  billing_cycle: BillingCycle;
  next_billing_date: string | null;
  status: SubscriptionStatus;
  type: string;
  trial_ends_at?: string | null;
  cancellation_path: string;
  confidence: number;
  evidence: Evidence[];
  last_seen_at: string;
};
type AiMessage = { role: "user" | "assistant"; content: string };

const languageNames: Record<Locale, string> = { ru: "Русский", en: "English", kk: "Қазақша" };
const localeTags: Record<Locale, string> = { ru: "ru-RU", en: "en-US", kk: "kk-KZ" };

const copy = {
  ru: {
    overview: "Обзор",
    subscriptions: "Подписки",
    evidence: "Доказательства",
    integrations: "Интеграции",
    history: "История",
    ai: "AI-помощник",
    account: "Аккаунт",
    connectBank: "Подключить банк",
    kaspiUnavailable: "Kaspi пока не доступен вашему API-аккаунту Salt Edge. TengeGuard уже готов к прямому подключению, но Salt Edge должен сначала выдать Test/Live-доступ к Kaspi Kazakhstan.",
    dashboardTitle: "Обзор подписок",
    dashboardText: "Реальные регулярные списания из подключённого банка.",
    monthlySpend: "Расходы в месяц",
    nextPayment: "Следующее списание",
    active: "Активные подписки",
    dueSoon: "Скоро списание",
    review: "Нужно проверить",
    confidence: "Средняя точность",
    noDataTitle: "Подключите банк, чтобы найти подписки",
    noDataText: "TengeGuard запросит только чтение истории транзакций. Переводы и управление счётом недоступны.",
    bankOnly: "Доступ только для чтения",
    telegramReady: "Telegram подключён",
    telegramMissing: "Подключите Telegram",
    trial: "Пробный период",
    days: "дн.",
    pro: "Pro активен",
    sync: "Обновить данные",
    syncing: "Обновляем",
    subscriptionsTitle: "Активные подписки",
    subscriptionsText: "Подтверждённые повторяющимися банковскими операциями.",
    search: "Найти подписку...",
    all: "Все",
    paid: "Платные",
    reviewFilter: "Проверить",
    provider: "Сервис",
    amount: "Сумма",
    cycle: "Период",
    nextDate: "Следующая дата",
    status: "Статус",
    action: "Действие",
    cancel: "Отменить",
    markCancelled: "Отметить отменённой",
    refund: "Попробовать вернуть",
    delete: "Удалить запись",
    empty: "Реальные подписки пока не найдены.",
    evidenceTitle: "Доказательства обнаружения",
    evidenceText: "Каждая запись показывает банковскую операцию, на которой основано обнаружение.",
    securityNote: "TengeGuard показывает только данные, полученные из разрешённой истории операций. Неподтверждённые подписки не создаются.",
    transaction: "Операция",
    date: "Дата",
    pattern: "Сигналы",
    source: "Источник",
    integrationsTitle: "Интеграции",
    integrationsText: "Только подключения, необходимые для поиска и уведомлений.",
    connected: "Подключено",
    ready: "Готово",
    unavailable: "Недоступно",
    bank: "Банк",
    bankText: "Salt Edge открывает защищённый экран выбора банка и запрашивает историю только для чтения.",
    telegram: "Telegram",
    telegramText: "Напоминания за неделю и за день до прогнозируемого списания.",
    telegramOpen: "Telegram открыт. Нажмите Start в боте, сайт подключится автоматически.",
    connectTelegram: "Подключить Telegram",
    testTelegram: "Отправить тест",
    google: "Google-аккаунт",
    googleText: "Используется только для входа. Доступ к Gmail не запрашивается.",
    historyTitle: "История подписок",
    current: "Текущие",
    cancelled: "Отменённые",
    aiTitle: "AI-помощник",
    aiText: "Задавайте вопросы о найденных подписках и расходах.",
    aiPlaceholder: "Например: какое списание будет следующим?",
    send: "Отправить",
    accountTitle: "Аккаунт",
    changeAccount: "Сменить Google-аккаунт",
    logout: "Выйти",
    plan: "Тариф",
    storage: "Хранилище",
    payment: "Оплата",
    cancelPlan: "Отменить Pro",
    cancelPlanText: "Остановить текущий платный доступ TengeGuard для этого аккаунта.",
    error: "Не удалось выполнить действие",
    expiredTitle: "Доступ закончился",
    expiredText: "Выберите Pro, чтобы продолжить мониторинг подписок.",
    choosePro: "Подключить Pro"
  },
  en: {
    overview: "Overview", subscriptions: "Subscriptions", evidence: "Evidence", integrations: "Integrations", history: "History", ai: "AI Assistant", account: "Account",
    connectBank: "Connect bank", kaspiUnavailable: "Kaspi is not yet available to your Salt Edge API account. TengeGuard is ready for direct connection, but Salt Edge must first grant Test/Live access to Kaspi Kazakhstan.", dashboardTitle: "Subscription overview", dashboardText: "Real recurring charges from your connected bank.",
    monthlySpend: "Monthly spend", nextPayment: "Next charge", active: "Active subscriptions", dueSoon: "Due soon", review: "Needs review", confidence: "Average confidence",
    noDataTitle: "Connect a bank to find subscriptions", noDataText: "TengeGuard requests read-only transaction history. It cannot transfer funds or manage your account.",
    bankOnly: "Read-only access", telegramReady: "Telegram connected", telegramMissing: "Connect Telegram", trial: "Free trial", days: "days", pro: "Pro active",
    sync: "Refresh data", syncing: "Refreshing", subscriptionsTitle: "Active subscriptions", subscriptionsText: "Confirmed by recurring bank transactions.",
    search: "Find a subscription...", all: "All", paid: "Paid", reviewFilter: "Review", provider: "Service", amount: "Amount", cycle: "Cycle", nextDate: "Next date",
    status: "Status", action: "Action", cancel: "Cancel", markCancelled: "Mark cancelled", refund: "Try refund", delete: "Delete record", empty: "No real subscriptions found yet.",
    evidenceTitle: "Detection evidence", evidenceText: "Each record shows the bank transaction behind the detection.",
    securityNote: "TengeGuard shows only data received from authorized transaction history. Unverified subscriptions are never created.",
    transaction: "Transaction", date: "Date", pattern: "Signals", source: "Source", integrationsTitle: "Integrations", integrationsText: "Only the connections required for detection and reminders.",
    connected: "Connected", ready: "Ready", unavailable: "Unavailable", bank: "Bank", bankText: "Salt Edge opens a secure bank selection flow and requests read-only history.",
    telegram: "Telegram", telegramText: "Reminders one week and one day before a predicted charge.", telegramOpen: "Telegram is open. Press Start in the bot and the site will connect automatically.", connectTelegram: "Connect Telegram", testTelegram: "Send test",
    google: "Google account", googleText: "Used only for sign-in. Gmail access is not requested.", historyTitle: "Subscription history", current: "Current", cancelled: "Cancelled",
    aiTitle: "AI Assistant", aiText: "Ask questions about detected subscriptions and spending.", aiPlaceholder: "For example: what is the next charge?", send: "Send",
    accountTitle: "Account", changeAccount: "Change Google account", logout: "Sign out", plan: "Plan", storage: "Storage", payment: "Payments", cancelPlan: "Cancel Pro", cancelPlanText: "Stop the current paid TengeGuard access for this account.",
    error: "Action failed", expiredTitle: "Access expired", expiredText: "Choose Pro to continue monitoring subscriptions.", choosePro: "Choose Pro"
  },
  kk: {
    overview: "Шолу", subscriptions: "Жазылымдар", evidence: "Дәлелдер", integrations: "Интеграциялар", history: "Тарих", ai: "AI көмекші", account: "Аккаунт",
    connectBank: "Банкті қосу", kaspiUnavailable: "Kaspi сіздің Salt Edge API аккаунтыңызға әзірше қолжетімсіз. TengeGuard тікелей қосылуға дайын, бірақ Salt Edge алдымен Kaspi Kazakhstan үшін Test/Live рұқсатын беруі керек.", dashboardTitle: "Жазылымдарға шолу", dashboardText: "Қосылған банктен алынған нақты қайталанатын төлемдер.",
    monthlySpend: "Айлық шығын", nextPayment: "Келесі төлем", active: "Белсенді жазылымдар", dueSoon: "Жақын төлем", review: "Тексеру керек", confidence: "Орташа дәлдік",
    noDataTitle: "Жазылымдарды табу үшін банкті қосыңыз", noDataText: "TengeGuard операциялар тарихын тек оқуға рұқсат сұрайды. Ақша аудару мүмкін емес.",
    bankOnly: "Тек оқуға рұқсат", telegramReady: "Telegram қосылған", telegramMissing: "Telegram қосу", trial: "Тегін кезең", days: "күн", pro: "Pro белсенді",
    sync: "Деректерді жаңарту", syncing: "Жаңартылуда", subscriptionsTitle: "Белсенді жазылымдар", subscriptionsText: "Қайталанатын банк операцияларымен расталған.",
    search: "Жазылымды табу...", all: "Барлығы", paid: "Ақылы", reviewFilter: "Тексеру", provider: "Сервис", amount: "Сома", cycle: "Кезең", nextDate: "Келесі күн",
    status: "Күй", action: "Әрекет", cancel: "Бас тарту", markCancelled: "Бас тартылды деп белгілеу", refund: "Қайтаруға тырысу", delete: "Жазбаны жою", empty: "Нақты жазылымдар әлі табылмады.",
    evidenceTitle: "Анықтау дәлелдері", evidenceText: "Әр жазба анықтауға негіз болған банк операциясын көрсетеді.",
    securityNote: "TengeGuard тек рұқсат етілген операциялар тарихынан алынған деректерді көрсетеді. Расталмаған жазылымдар жасалмайды.",
    transaction: "Операция", date: "Күні", pattern: "Белгілер", source: "Дереккөз", integrationsTitle: "Интеграциялар", integrationsText: "Тек іздеу мен ескертулерге қажетті қосылымдар.",
    connected: "Қосылған", ready: "Дайын", unavailable: "Қолжетімсіз", bank: "Банк", bankText: "Salt Edge қауіпсіз банк таңдау терезесін ашып, тарихты тек оқуға сұрайды.",
    telegram: "Telegram", telegramText: "Болжамды төлемге бір апта және бір күн қалғанда ескерту.", telegramOpen: "Telegram ашылды. Ботта Start басыңыз, сайт автоматты түрде қосылады.", connectTelegram: "Telegram қосу", testTelegram: "Тест жіберу",
    google: "Google аккаунты", googleText: "Тек кіру үшін. Gmail рұқсаты сұралмайды.", historyTitle: "Жазылымдар тарихы", current: "Ағымдағы", cancelled: "Тоқтатылған",
    aiTitle: "AI көмекші", aiText: "Табылған жазылымдар мен шығындар туралы сұраңыз.", aiPlaceholder: "Мысалы: келесі төлем қандай?", send: "Жіберу",
    accountTitle: "Аккаунт", changeAccount: "Google аккаунтын ауыстыру", logout: "Шығу", plan: "Тариф", storage: "Сақтау", payment: "Төлем", cancelPlan: "Pro тоқтату", cancelPlanText: "Осы аккаунт үшін TengeGuard ақылы қолжетімділігін тоқтату.",
    error: "Әрекет орындалмады", expiredTitle: "Қолжетімділік аяқталды", expiredText: "Бақылауды жалғастыру үшін Pro таңдаңыз.", choosePro: "Pro қосу"
  }
};

const routes: Record<DashboardView, string> = {
  dashboard: "/dashboard",
  subscriptions: "/dashboard/subscriptions",
  ai: "/dashboard/ai",
  account: "/dashboard/account"
};

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || payload.detail || "Request failed");
  return payload as T;
}

function daysUntil(value?: string | null) {
  if (!value) return null;
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
}

function monthlyCost(item: Subscription) {
  if (item.billing_cycle === "yearly") return item.cost / 12;
  if (item.billing_cycle === "weekly") return item.cost * 4.345;
  return item.cost;
}

export default function App({
  initialBillingEndsAt = null,
  initialBillingPlan = "free",
  initialDeviceMode = "desktop",
  initialTrialStartedAt = null,
  initialView = "dashboard"
}: {
  initialBillingEndsAt?: string | null;
  initialBillingPlan?: BillingPlan;
  initialDeviceMode?: DeviceMode;
  initialTrialStartedAt?: string | null;
  initialView?: DashboardView;
} = {}) {
  const [locale, setLocale] = useState<Locale>("ru");
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [telegram, setTelegram] = useState<TelegramStatus | null>(null);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [aiInput, setAiInput] = useState("");
  const [aiSending, setAiSending] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const telegramTimer = useRef<number | null>(null);
  const t = copy[locale];

  const load = useCallback(async () => {
    const secondary = Promise.all([
      readJson<TelegramStatus>("/api/telegram/status"),
      readJson<Readiness>("/api/system/readiness")
    ]).then(([telegramData, readinessData]) => {
      setTelegram(telegramData);
      setReadiness(readinessData);
    });

    const [authData, connectorData, subscriptionData] = await Promise.all([
      readJson<AuthStatus>("/api/subcut/gmail/status"),
      readJson<{ connectors: Connector[] }>("/api/connectors/status"),
      readJson<{ subscriptions: Subscription[] }>("/api/subscriptions")
    ]);
    setAuth(authData);
    setConnectors(connectorData.connectors || []);
    setSubscriptions(subscriptionData.subscriptions || []);
    await secondary.catch(() => null);
  }, []);

  useEffect(() => {
    load().catch((requestError) => setError(requestError instanceof Error ? requestError.message : t.error)).finally(() => setLoading(false));
  }, [load, t.error]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const bankError = url.searchParams.get("bank_error");
    if (!bankError) return;
    setError(bankError === "kaspi_unavailable" ? t.kaspiUnavailable : t.error);
    url.searchParams.delete("bank_error");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [t.error, t.kaspiUnavailable]);

  useEffect(() => () => {
    if (telegramTimer.current) window.clearInterval(telegramTimer.current);
  }, []);

  const active = useMemo(() => subscriptions.filter((item) => item.status !== "cancelled"), [subscriptions]);
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return active
      .filter((item) => filter === "all" || (filter === "paid" ? item.cost > 0 : item.status === "review" || item.confidence < 0.75))
      .filter((item) => !search || `${item.provider_name} ${item.currency} ${item.evidence.map((entry) => entry.subject || entry.snippet || "").join(" ")}`.toLowerCase().includes(search))
      .sort((a, b) => (new Date(a.next_billing_date || "9999-12-31").getTime() - new Date(b.next_billing_date || "9999-12-31").getTime()));
  }, [active, filter, query]);

  const monthlyByCurrency = useMemo(() => {
    const totals = new Map<string, number>();
    active.forEach((item) => totals.set(item.currency || "KZT", (totals.get(item.currency || "KZT") || 0) + monthlyCost(item)));
  return Array.from(totals.entries()).map(([currency, value]) => `${Math.round(value).toLocaleString(localeTags[locale])} ${currency}`).join(" + ") || "—";
  }, [active, locale]);

  const nextSubscription = useMemo(() => active.filter((item) => item.next_billing_date).sort((a, b) => String(a.next_billing_date).localeCompare(String(b.next_billing_date)))[0], [active]);
  const dueSoon = active.filter((item) => {
    const days = daysUntil(item.next_billing_date);
    return days !== null && days >= 0 && days <= 7;
  }).length;
  const reviewCount = active.filter((item) => item.status === "review" || item.confidence < 0.75).length;
  const averageConfidence = active.length ? Math.round(active.reduce((sum, item) => sum + item.confidence, 0) / active.length * 100) : 0;
  const trialStarted = initialTrialStartedAt ? new Date(initialTrialStartedAt).getTime() : Date.now();
  const trialDays = Math.max(0, 14 - Math.floor((Date.now() - trialStarted) / 86_400_000));
  const paidDays = initialBillingEndsAt ? Math.max(0, daysUntil(initialBillingEndsAt) || 0) : 0;
  const accessDays = initialBillingPlan === "free" ? trialDays : paidDays;
  const expired = accessDays <= 0;
  const bank = connectors.find((item) => item.id === "bank");

  async function refresh() {
    setSyncing(true);
    setError(null);
    try {
      await readJson("/api/connectors/sync-all", { method: "POST" });
      await load();
      setNotice(t.sync);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.error);
    } finally {
      setSyncing(false);
    }
  }

  function connectBank() {
    window.location.href = "/api/connectors/bank/start?provider=kaspi";
  }

  function connectTelegram() {
    const popup = window.open("/api/telegram/connect", "tengeguard-telegram");
    if (!popup) {
      window.location.href = "/api/telegram/connect";
      return;
    }
    popup.opener = null;
    setNotice(t.telegramOpen);
    let checks = 0;
    telegramTimer.current = window.setInterval(async () => {
      checks += 1;
      const next = await readJson<TelegramStatus>("/api/telegram/status").catch(() => null);
      if (next) setTelegram(next);
      if (next?.connected || checks >= 80) {
        if (telegramTimer.current) window.clearInterval(telegramTimer.current);
        telegramTimer.current = null;
        if (next?.connected) setNotice(t.telegramReady);
      }
    }, 1500);
  }

  async function testTelegram() {
    setError(null);
    try {
      await readJson("/api/telegram/test", { method: "POST" });
      setNotice(t.testTelegram);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.error);
    }
  }

  async function subscriptionAction(item: Subscription, action: "cancel" | "cancelled" | "refund" | "delete") {
    setWorkingId(item.id);
    setError(null);
    try {
      if (action === "delete") {
        await readJson(`/api/subscriptions/${item.id}`, { method: "DELETE" });
      } else {
        const result = await readJson<{ result?: { cancellation_path?: string; refund_path?: string; reason?: string } }>(`/api/subscriptions/${item.id}/${action}`, { method: "POST" });
        const path = result.result?.cancellation_path || result.result?.refund_path;
        if (path) window.open(path, "_blank", "noopener,noreferrer");
        if (result.result?.reason) setNotice(result.result.reason);
      }
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.error);
    } finally {
      setWorkingId(null);
    }
  }

  async function submitAi(event: React.FormEvent) {
    event.preventDefault();
    const question = aiInput.trim();
    if (!question || aiSending) return;
    const messages = [...aiMessages, { role: "user" as const, content: question }];
    setAiMessages(messages);
    setAiInput("");
    setAiSending(true);
    try {
      const response = await readJson<{ answer: string }>("/api/ai-chat", { method: "POST", body: JSON.stringify({ messages: messages.slice(-10) }) });
      setAiMessages((current) => [...current, { role: "assistant", content: response.answer }]);
    } catch (requestError) {
      setAiMessages((current) => [...current, { role: "assistant", content: requestError instanceof Error ? requestError.message : t.error }]);
    } finally {
      setAiSending(false);
    }
  }

  async function logout(changeAccount = false) {
    await readJson("/api/subcut/gmail/logout", { method: "POST" }).catch(() => null);
    window.location.href = changeAccount ? "/api/auth/google" : "/";
  }

  const nav = [
    ["dashboard", t.overview, LayoutDashboard],
    ["subscriptions", t.subscriptions, WalletCards],
    ["ai", t.ai, Bot]
  ] as const;

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#16181a]">
      <div className="min-h-screen md:flex">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-[#e7e9ec] bg-white px-4 py-6 md:flex">
          <Brand />
          <nav className="mt-10 flex-1 space-y-1">
            {nav.map(([view, label, Icon]) => (
              <Link className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${initialView === view ? "bg-[#f3f4f5] font-semibold text-black" : "text-[#5f6368] hover:bg-[#f8f9fa] hover:text-black"}`} href={routes[view]} key={view}>
                <Icon className="h-[18px] w-[18px]" />{label}
              </Link>
            ))}
          </nav>
          <div className="space-y-2 border-t border-[#e5e7eb] pt-4">
            <Link className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${initialView === "account" ? "bg-[#f3f4f5] text-black" : "text-[#5f6368]"}`} href="/dashboard/account"><Settings className="h-[18px] w-[18px]" />{t.account}</Link>
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-45" disabled={bank?.status === "connected" || bank?.status === "setup_required" || bank?.status === "not_available"} onClick={connectBank} type="button">
              <Landmark className="h-4 w-4" />{bank?.status === "connected" ? t.connected : t.connectBank}
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#e7e9ec] bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
            <div className="md:hidden"><Brand compact /></div>
            <div className="hidden md:block">
              <h1 className="font-display text-lg font-semibold">{nav.find(([view]) => view === initialView)?.[1] || t.account}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className={`hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold lg:flex ${initialBillingPlan === "free" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                <Clock3 className="h-3.5 w-3.5" />{initialBillingPlan === "free" ? `${t.trial}: ${accessDays} ${t.days}` : `${t.pro}: ${accessDays} ${t.days}`}
              </span>
              <select aria-label="Language" className="h-9 rounded-lg border border-[#e5e7eb] bg-white px-2 text-xs font-semibold outline-none" onChange={(event) => setLocale(event.target.value as Locale)} value={locale}>
                {(Object.keys(languageNames) as Locale[]).map((item) => <option key={item} value={item}>{languageNames[item]}</option>)}
              </select>
              <Link className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-[#e5e7eb] bg-[#f3f4f5]" href="/dashboard/account">
                {auth?.user?.avatar_url ? (
                  <img alt={auth.user.name} className="h-full w-full object-cover" src={auth.user.avatar_url} />
                ) : <UserCircle2 className="h-5 w-5 text-[#76777d]" />}
              </Link>
            </div>
          </header>

          <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            {error ? <Notice tone="error" text={error} title={t.error} onClose={() => setError(null)} /> : null}
            {notice ? <Notice tone="success" text={notice} title="TengeGuard" onClose={() => setNotice(null)} /> : null}

            {loading ? <DashboardSkeleton /> : expired ? (
              <EmptyPanel icon={Clock3} title={t.expiredTitle} text={t.expiredText}>
                <Link className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white" href="/api/billing/checkout?plan=pro_monthly">{t.choosePro}<ArrowRight className="h-4 w-4" /></Link>
              </EmptyPanel>
            ) : (
              <>
                {initialView === "dashboard" ? (
                  <Dashboard
                    active={active}
                    averageConfidence={averageConfidence}
                    bankConnected={bank?.status === "connected"}
                    dueSoon={dueSoon}
                    locale={locale}
                    monthly={monthlyByCurrency}
                    next={nextSubscription}
                    onBank={connectBank}
                    onRefresh={refresh}
                    onTelegram={connectTelegram}
                    onTestTelegram={testTelegram}
                    review={reviewCount}
                    syncing={syncing}
                    t={t}
                    telegramConnected={Boolean(telegram?.connected)}
                  />
                ) : null}
                {initialView === "subscriptions" ? (
                  <SubscriptionsView filter={filter} items={filtered} locale={locale} onAction={subscriptionAction} query={query} setFilter={setFilter} setQuery={setQuery} t={t} workingId={workingId} />
                ) : null}
                {initialView === "ai" ? <AiView input={aiInput} messages={aiMessages} onChange={setAiInput} onSubmit={submitAi} sending={aiSending} t={t} /> : null}
                {initialView === "account" ? <AccountView auth={auth} initialBillingPlan={initialBillingPlan} onChange={() => logout(true)} onLogout={() => logout(false)} readiness={readiness} t={t} telegram={telegram} bank={bank} /> : null}
              </>
            )}
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center overflow-x-auto border-t border-[#e5e7eb] bg-white px-2 md:hidden">
        {nav.map(([view, label, Icon]) => <Link className={`flex min-w-[72px] flex-1 flex-col items-center gap-1 text-[10px] font-semibold ${initialView === view ? "text-black" : "text-[#76777d]"}`} href={routes[view]} key={view}><Icon className="h-5 w-5" />{label}</Link>)}
        <Link className={`flex min-w-[72px] flex-1 flex-col items-center gap-1 text-[10px] font-semibold ${initialView === "account" ? "text-black" : "text-[#76777d]"}`} href="/dashboard/account"><Settings className="h-5 w-5" />{t.account}</Link>
      </nav>
    </main>
  );
}

type T = (typeof copy)["ru"];

function Brand({ compact = false }: { compact?: boolean }) {
  return <Link className="flex items-center gap-2.5" href="/dashboard"><span className={`${compact ? "h-8 w-8" : "h-9 w-9"} overflow-hidden rounded-lg border border-[#e5e7eb] bg-white`}><img alt="TengeGuard" className="h-full w-full object-cover" src="/tengeguard-mark.jpg" /></span><span className="font-display text-xl font-bold leading-none">TengeGuard</span></Link>;
}

function PageTitle({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-display text-[38px] font-semibold leading-10 sm:text-[46px] sm:leading-[48px]">{title}</h2><p className="mt-2 text-sm leading-6 text-[#6b7280]">{text}</p></div>{action}</div>;
}

function Dashboard({ active, averageConfidence, bankConnected, dueSoon, locale, monthly, next, onBank, onRefresh, onTelegram, onTestTelegram, review, syncing, t, telegramConnected }: { active: Subscription[]; averageConfidence: number; bankConnected: boolean; dueSoon: number; locale: Locale; monthly: string; next?: Subscription; onBank: () => void; onRefresh: () => void; onTelegram: () => void; onTestTelegram: () => void; review: number; syncing: boolean; t: T; telegramConnected: boolean }) {
  return (
    <section>
      <PageTitle action={<button className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50" disabled={syncing || !bankConnected} onClick={onRefresh} type="button">{syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}{syncing ? t.syncing : t.sync}</button>} text={t.dashboardText} title={t.dashboardTitle} />
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr]">
        <StatCard icon={CircleDollarSign} label={t.monthlySpend} large value={monthly} />
        <StatCard icon={CalendarDays} label={t.nextPayment} large value={next ? `${next.provider_name} · ${formatDate(next.next_billing_date, locale)}` : "—"} warning={Boolean(next && (daysUntil(next.next_billing_date) || 99) <= 7)} />
        <div className="grid grid-cols-2 gap-4">
          <MiniStat label={t.active} value={active.length} />
          <MiniStat label={t.dueSoon} value={dueSoon} />
          <MiniStat label={t.review} value={review} />
          <MiniStat label={t.confidence} value={`${averageConfidence}%`} />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <StatusChip active={bankConnected} label={bankConnected ? t.bankOnly : t.connectBank} onClick={bankConnected ? undefined : onBank} />
        <StatusChip active={telegramConnected} label={telegramConnected ? t.telegramReady : t.telegramMissing} onClick={telegramConnected ? undefined : onTelegram} />
      </div>
      <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-[#dfe3e7] bg-[#111315] p-6 text-white shadow-[0_18px_50px_-32px_rgba(0,0,0,0.55)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10"><MessageCircle className="h-5 w-5 text-[#5ee3a1]" /></span>
          <div><h3 className="font-display text-lg font-semibold">{t.telegram}</h3><p className="mt-1 max-w-xl text-sm leading-6 text-white/60">{t.telegramText}</p></div>
        </div>
        <button className={`shrink-0 rounded-lg px-5 py-3 text-sm font-semibold ${telegramConnected ? "border border-white/20 bg-white/5 text-white" : "bg-white text-black"}`} onClick={telegramConnected ? onTestTelegram : onTelegram} type="button">
          {telegramConnected ? t.testTelegram : t.connectTelegram}
        </button>
      </div>
      {!active.length ? (
        <div className="mt-8"><EmptyPanel icon={Landmark} title={t.noDataTitle} text={t.noDataText}><button className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-45" disabled={bankConnected} onClick={onBank} type="button"><Landmark className="h-4 w-4" />{bankConnected ? t.sync : t.connectBank}</button></EmptyPanel></div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4"><h3 className="font-display text-lg font-semibold">{t.nextPayment}</h3><Link className="flex items-center gap-1 text-xs font-semibold" href="/dashboard/subscriptions">{t.subscriptions}<ChevronRight className="h-4 w-4" /></Link></div>
          <div className="divide-y divide-[#e5e7eb]">{active.slice(0, 4).map((item) => <SubscriptionRow item={item} key={item.id} locale={locale} />)}</div>
        </div>
      )}
    </section>
  );
}

function SubscriptionsView({ filter, items, locale, onAction, query, setFilter, setQuery, t, workingId }: { filter: Filter; items: Subscription[]; locale: Locale; onAction: (item: Subscription, action: "cancel" | "cancelled" | "refund" | "delete") => void; query: string; setFilter: (value: Filter) => void; setQuery: (value: string) => void; t: T; workingId: string | null }) {
  return (
    <section>
      <PageTitle text={t.subscriptionsText} title={t.subscriptionsTitle} />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative w-full lg:max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#76777d]" /><input className="h-11 w-full rounded-lg border border-[#e5e7eb] bg-white pl-10 pr-4 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10" onChange={(event) => setQuery(event.target.value)} placeholder={t.search} value={query} /></label>
        <div className="flex overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
          {([["all", t.all], ["paid", t.paid], ["review", t.reviewFilter]] as const).map(([value, label]) => <button className={`border-r border-[#e5e7eb] px-5 py-2.5 text-xs font-semibold last:border-0 ${filter === value ? "bg-[#f3f4f5] text-black" : "text-[#6b7280]"}`} key={value} onClick={() => setFilter(value)} type="button">{label}</button>)}
        </div>
      </div>
      {!items.length ? <EmptyPanel icon={WalletCards} text={t.noDataText} title={t.empty} /> : (
        <div className="overflow-x-auto rounded-xl border border-[#e5e7eb] bg-white shadow-stitch">
          <table className="w-full min-w-[920px] text-left">
            <thead className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-xs font-semibold text-[#6b7280]"><tr><th className="px-5 py-4">{t.provider}</th><th className="px-5 py-4">{t.amount}</th><th className="px-5 py-4">{t.cycle}</th><th className="px-5 py-4">{t.nextDate}</th><th className="px-5 py-4">{t.confidence}</th><th className="px-5 py-4">{t.action}</th></tr></thead>
            <tbody className="divide-y divide-[#e5e7eb]">{items.map((item) => <SubscriptionTableRow item={item} key={item.id} locale={locale} onAction={onAction} t={t} working={workingId === item.id} />)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AiView({ input, messages, onChange, onSubmit, sending, t }: { input: string; messages: AiMessage[]; onChange: (value: string) => void; onSubmit: (event: React.FormEvent) => void; sending: boolean; t: T }) {
  return (
    <section><PageTitle text={t.aiText} title={t.aiTitle} />
      <div className="flex min-h-[560px] flex-col rounded-xl border border-[#e5e7eb] bg-white shadow-stitch">
        <div className="flex items-center gap-3 border-b border-[#e5e7eb] px-5 py-4"><span className="grid h-9 w-9 place-items-center rounded-lg bg-black text-white"><Bot className="h-4 w-4" /></span><div><p className="font-display font-semibold">TengeGuard AI</p><p className="text-xs text-[#76777d]">{t.aiText}</p></div></div>
        <div className="flex-1 space-y-4 p-5">{messages.length ? messages.map((message, index) => <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`} key={index}><p className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-black text-white" : "bg-[#f3f4f5]"}`}>{message.content}</p></div>) : <div className="grid h-full min-h-80 place-items-center text-center"><div><Bot className="mx-auto h-7 w-7 text-[#76777d]" /><p className="mt-3 text-sm text-[#6b7280]">{t.aiText}</p></div></div>}</div>
        <form className="flex gap-3 border-t border-[#e5e7eb] p-4" onSubmit={onSubmit}><input className="h-12 flex-1 rounded-lg border border-[#e5e7eb] px-4 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10" disabled={sending} onChange={(event) => onChange(event.target.value)} placeholder={t.aiPlaceholder} value={input} /><button className="inline-flex h-12 items-center gap-2 rounded-lg bg-black px-5 text-sm font-semibold text-white disabled:opacity-40" disabled={sending || !input.trim()} type="submit">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}<span className="hidden sm:inline">{t.send}</span></button></form>
      </div>
    </section>
  );
}

function AccountView({ auth, bank, initialBillingPlan, onChange, onLogout, readiness, t, telegram }: { auth: AuthStatus | null; bank?: Connector; initialBillingPlan: BillingPlan; onChange: () => void; onLogout: () => void; readiness: Readiness | null; t: T; telegram: TelegramStatus | null }) {
  return (
    <section><PageTitle text={auth?.user?.email || ""} title={t.accountTitle} />
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-stitch">
          <div className="flex items-center gap-4"><div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f3f4f5]">{auth?.user?.avatar_url ? <img alt={auth.user.name} className="h-full w-full object-cover" src={auth.user.avatar_url} /> : <UserCircle2 className="h-7 w-7" />}</div><div><h3 className="font-display text-xl font-semibold">{auth?.user?.name || "TengeGuard user"}</h3><p className="mt-1 text-sm text-[#6b7280]">{auth?.user?.email}</p></div></div>
          <div className="mt-6 flex flex-wrap gap-3"><button className="rounded-lg border border-[#e5e7eb] px-4 py-2.5 text-sm font-semibold" onClick={onChange} type="button">{t.changeAccount}</button><button className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700" onClick={onLogout} type="button"><LogOut className="h-4 w-4" />{t.logout}</button></div>
        </div>
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-stitch"><h3 className="font-display text-lg font-semibold">{t.status}</h3><div className="mt-5 space-y-3"><StatusLine label={t.plan} ready value={initialBillingPlan === "free" ? t.trial : t.pro} /><StatusLine label={t.bank} ready={bank?.status === "connected"} /><StatusLine label={t.telegram} ready={Boolean(telegram?.connected)} /><StatusLine label={t.storage} ready={Boolean(readiness?.persistentStoreConfigured)} /></div></div>
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-stitch lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-xl font-semibold">{t.payment}</h3>
              <p className="mt-1 max-w-xl text-sm leading-6 text-[#6b7280]">{initialBillingPlan === "free" ? t.expiredText : t.cancelPlanText}</p>
            </div>
            {initialBillingPlan === "free" ? (
              <Link className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white" href="/api/billing/checkout?plan=pro_monthly">{t.choosePro}<ArrowRight className="h-4 w-4" /></Link>
            ) : (
              <form action="/api/billing/cancel" method="POST">
                <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100" type="submit">
                  <XCircle className="h-4 w-4" />{t.cancelPlan}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ icon: Icon, label, large, value, warning = false }: { icon: React.ElementType; label: string; large?: boolean; value: string; warning?: boolean }) {
  return <div className="flex h-40 flex-col justify-between rounded-xl border border-[#e5e7eb] bg-white p-6 transition-shadow hover:shadow-soft"><div className="flex items-center justify-between"><span className="text-sm text-[#6b7280]">{label}</span><Icon className="h-5 w-5 text-[#76777d]" /></div><div><p className={`font-body-md font-semibold tabular-nums ${large ? "text-2xl sm:text-3xl" : "text-xl"}`}>{value}</p>{warning ? <span className="mt-2 inline-flex rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">Soon</span> : null}</div></div>;
}
function MiniStat({ label, value }: { label: string; value: string | number }) { return <div className="flex min-h-[72px] items-center justify-between rounded-xl border border-[#e5e7eb] bg-white p-4"><span className="text-xs leading-5 text-[#6b7280]">{label}</span><strong className="ml-3 font-body-md text-xl tabular-nums">{value}</strong></div>; }
function StatusChip({ active, label, onClick }: { active: boolean; label: string; onClick?: () => void }) { const Tag = onClick ? "button" : "span"; return <Tag className="flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-3 py-2 text-xs font-semibold" onClick={onClick}><span className={`h-2 w-2 rounded-full ${active ? "bg-emerald-500" : "bg-amber-500"}`} />{label}</Tag>; }
function SubscriptionRow({ item, locale }: { item: Subscription; locale: Locale }) { return <div className="flex items-center justify-between gap-4 px-5 py-4"><div className="flex min-w-0 items-center gap-3"><ServiceIcon name={item.provider_name} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.provider_name}</p><p className="mt-0.5 text-xs text-[#76777d]">{formatDate(item.next_billing_date, locale)}</p></div></div><p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(item, locale)}</p></div>; }
function SubscriptionTableRow({ item, locale, onAction, t, working }: { item: Subscription; locale: Locale; onAction: (item: Subscription, action: "cancel" | "cancelled" | "refund" | "delete") => void; t: T; working: boolean }) { return <tr className="hover:bg-[#f8f9fa]"><td className="px-5 py-4"><div className="flex items-center gap-3"><ServiceIcon name={item.provider_name} /><div><p className="font-semibold">{item.provider_name}</p><p className="mt-0.5 text-xs text-[#76777d]">{item.evidence.length} {t.evidence.toLowerCase()}</p></div></div></td><td className="px-5 py-4 text-sm font-semibold tabular-nums">{formatMoney(item, locale)}</td><td className="px-5 py-4 text-sm text-[#5f6368]">{cycleName(item.billing_cycle, locale)}</td><td className="px-5 py-4 text-sm tabular-nums">{formatDate(item.next_billing_date, locale)}</td><td className="px-5 py-4"><Confidence value={item.confidence} /></td><td className="px-5 py-4"><div className="flex items-center gap-2">{working ? <Loader2 className="h-4 w-4 animate-spin" /> : <><button className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-xs font-semibold hover:border-black" onClick={() => onAction(item, "cancel")} type="button">{t.cancel}</button><button aria-label={t.markCancelled} className="grid h-8 w-8 place-items-center rounded-lg border border-[#e5e7eb]" onClick={() => onAction(item, "cancelled")} title={t.markCancelled} type="button"><Check className="h-4 w-4" /></button></>}</div></td></tr>; }
function ServiceIcon({ name }: { name: string }) { return <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#e5e7eb] bg-[#f3f4f5] text-sm font-bold">{name.slice(0, 1).toUpperCase()}</span>; }
function Confidence({ value }: { value: number }) { const percent = Math.round(value * 100); return <div className="flex items-center gap-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${percent >= 85 ? "bg-emerald-50 text-emerald-700" : percent >= 70 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{percent}%</span><span className="h-1.5 w-12 overflow-hidden rounded-full bg-[#e5e7eb]"><span className="block h-full bg-black" style={{ width: `${percent}%` }} /></span></div>; }
function StatusLine({ label, ready, value }: { label: string; ready: boolean; value?: string }) { return <div className="flex items-center justify-between gap-4 rounded-lg bg-[#f8f9fa] px-4 py-3 text-sm"><span>{label}</span><span className={`flex items-center gap-1.5 font-semibold ${ready ? "text-emerald-700" : "text-amber-700"}`}>{ready ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}{value || (ready ? "Ready" : "Setup")}</span></div>; }
function EmptyPanel({ children, icon: Icon, text, title }: { children?: React.ReactNode; icon: React.ElementType; text: string; title: string }) { return <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-[#e5e7eb] bg-white p-8 text-center shadow-stitch"><div className="max-w-lg"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#f3f4f5]"><Icon className="h-7 w-7" /></span><h3 className="mt-5 font-display text-2xl font-semibold">{title}</h3><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6b7280]">{text}</p>{children ? <div className="mt-6">{children}</div> : null}</div></div>; }
function DashboardSkeleton() {
  return <div aria-label="Loading" className="animate-pulse"><div className="h-10 w-64 rounded-lg bg-[#e8eaed]" /><div className="mt-3 h-4 w-96 max-w-full rounded bg-[#eceef0]" /><div className="mt-10 grid gap-4 xl:grid-cols-3"><div className="h-40 rounded-xl bg-white" /><div className="h-40 rounded-xl bg-white" /><div className="grid grid-cols-2 gap-4"><div className="rounded-xl bg-white" /><div className="rounded-xl bg-white" /><div className="rounded-xl bg-white" /><div className="rounded-xl bg-white" /></div></div><div className="mt-6 h-28 rounded-2xl bg-[#e6e8eb]" /></div>;
}
function Notice({ onClose, text, title, tone }: { onClose: () => void; text: string; title: string; tone: "error" | "success" }) { return <div className={`mb-5 flex items-start gap-3 rounded-xl border p-4 ${tone === "error" ? "border-red-200 bg-red-50 text-red-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{tone === "error" ? <XCircle className="mt-0.5 h-5 w-5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}<div className="flex-1"><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-sm leading-6">{text}</p></div><button aria-label="Close" onClick={onClose} type="button"><XCircle className="h-4 w-4" /></button></div>; }
function formatDate(value: string | null | undefined, locale: Locale) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(localeTags[locale], { day: "2-digit", month: "short", year: "numeric" }).format(date); }
function formatMoney(item: Subscription, locale: Locale) { try { return new Intl.NumberFormat(localeTags[locale], { style: "currency", currency: item.currency || "KZT", maximumFractionDigits: 0 }).format(item.cost); } catch { return `${item.cost.toLocaleString(localeTags[locale])} ${item.currency}`; } }
function cycleName(cycle: BillingCycle, locale: Locale) { const names = { ru: { monthly: "Ежемесячно", yearly: "Ежегодно", weekly: "Еженедельно", unknown: "Не определено" }, en: { monthly: "Monthly", yearly: "Yearly", weekly: "Weekly", unknown: "Unknown" }, kk: { monthly: "Ай сайын", yearly: "Жыл сайын", weekly: "Апта сайын", unknown: "Белгісіз" } }; return names[locale][cycle]; }
