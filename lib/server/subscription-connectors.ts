import crypto from "node:crypto";
import path from "node:path";
import { readStoredJson, writeStoredJson } from "@/lib/server/data-store";
import { parseSubscriptionImport } from "@/lib/server/subscription-import";
import { storagePath } from "@/lib/server/storage-root";
import { saveImportedSubscriptions, type SessionUser } from "@/lib/server/subcut-gmail";

type ConnectorStatus = "connected" | "ready" | "setup_required" | "not_available";

export type AutomaticConnector = {
  id: "bank";
  name: string;
  status: ConnectorStatus;
  coverage: string;
  action: string;
  setup?: string;
};

function bankProviderName() {
  return process.env.TENGEGUARD_BANK_PROVIDER || "Salt Edge Open Banking";
}

function saltedgeAppId() {
  return process.env.TENGEGUARD_BANK_PROVIDER_KEY || process.env.SALTEDGE_APP_ID || "";
}

function saltedgeSecret() {
  return process.env.TENGEGUARD_BANK_PROVIDER_SECRET || process.env.SALTEDGE_SECRET || "";
}

function saltedgeBaseUrl() {
  return (process.env.TENGEGUARD_BANK_PROVIDER_URL || "https://www.saltedge.com/api/v6").replace(/\/+$/g, "");
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/g, "");
}

function bankReady() {
  return Boolean(saltedgeAppId() && saltedgeSecret());
}

type SaltEdgeState = {
  customer_id?: string;
  connections: string[];
  updated_at: string;
};

const bankStateRoot = storagePath("bank");
const bankSessionCookieName = "tg_bank_session";

function bankSessionSecret() {
  return (
    process.env.TENGEGUARD_SESSION_SECRET ||
    process.env.TENGEGUARD_ADMIN_SECRET ||
    process.env.TENGEGUARD_BANK_PROVIDER_SECRET ||
    process.env.SALTEDGE_SECRET ||
    "tengeguard-local-bank-session-secret"
  );
}

function requestCookie(request: Request | undefined, name: string) {
  return request?.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))?.[1];
}

function encryptBankSession(userId: string, state: SaltEdgeState) {
  const key = crypto.createHash("sha256").update(bankSessionSecret()).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify({ user_id: userId, ...state }), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decryptBankSession(request: Request | undefined, userId: string): SaltEdgeState | null {
  const value = requestCookie(request, bankSessionCookieName);
  if (!value) return null;
  const [version, ivValue, tagValue, encryptedValue] = decodeURIComponent(value).split(".");
  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) return null;

  try {
    const key = crypto.createHash("sha256").update(bankSessionSecret()).digest();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivValue, "base64url"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    const payload = JSON.parse(
      Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8")
    ) as SaltEdgeState & { user_id?: string };
    if (payload.user_id !== userId) return null;
    return {
      customer_id: payload.customer_id,
      connections: Array.isArray(payload.connections) ? payload.connections : [],
      updated_at: payload.updated_at || new Date().toISOString()
    };
  } catch {
    return null;
  }
}

export function getBankSessionCookieName() {
  return bankSessionCookieName;
}

export function createEncryptedBankSession(userId: string, state: SaltEdgeState) {
  return encryptBankSession(userId, state);
}

function statePath(userId: string) {
  return path.join(bankStateRoot, `${userId}.json`);
}

async function readBankState(userId: string, request?: Request): Promise<SaltEdgeState> {
  return (
    (await readStoredJson<SaltEdgeState>(statePath(userId))) ||
    decryptBankSession(request, userId) ||
    { connections: [], updated_at: new Date().toISOString() }
  );
}

async function writeBankState(userId: string, state: SaltEdgeState) {
  await writeStoredJson(statePath(userId), { ...state, updated_at: new Date().toISOString() });
}

async function saltedgeFetch<T>(pathName: string, options: RequestInit = {}) {
  if (!bankReady()) throw new Error("Salt Edge API keys are not configured");
  const response = await fetch(`${saltedgeBaseUrl()}${pathName.startsWith("/") ? pathName : `/${pathName}`}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "App-id": saltedgeAppId(),
      Secret: saltedgeSecret(),
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = data?.error?.message || data?.error_message || data?.message || `Salt Edge API failed with ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}

type SaltEdgeCustomerResponse = {
  data: {
    customer_id: string;
  };
};

type SaltEdgeConnectResponse = {
  data: {
    connect_url: string;
    customer_id: string;
  };
};

type SaltEdgeListResponse<T> = {
  data: T[];
};

type SaltEdgeConnection = {
  id?: string;
  connection_id?: string;
};

type SaltEdgeAccount = {
  id?: string;
  account_id?: string;
};

type SaltEdgeTransaction = {
  made_on?: string;
  description?: string;
  amount?: number;
  currency_code?: string;
  extra?: {
    payee?: string;
    payee_information?: string;
  };
};

async function ensureSaltEdgeCustomer(user: SessionUser, request?: Request) {
  const state = await readBankState(user.id, request);
  if (state.customer_id) return state.customer_id;

  const response = await saltedgeFetch<SaltEdgeCustomerResponse>("/customers", {
    method: "POST",
    body: JSON.stringify({
      data: {
        identifier: user.id
      }
    })
  });
  await writeBankState(user.id, { ...state, customer_id: response.data.customer_id });
  return response.data.customer_id;
}

export function bankConnectUrl(user: SessionUser) {
  const value = process.env.TENGEGUARD_BANK_CONNECT_URL;
  if (!value || bankReady()) return null;

  const url = new URL(value);
  url.searchParams.set("state", `tengeguard:${user.id}`);
  url.searchParams.set("user_id", user.id);
  url.searchParams.set("email", user.email);
  return url.toString();
}

export async function createBankConnectUrl(user: SessionUser) {
  return (await createBankConnectSession(user)).connectUrl;
}

export async function createBankConnectSession(user: SessionUser, request?: Request) {
  if (!bankReady()) return { connectUrl: bankConnectUrl(user), state: await readBankState(user.id, request) };
  const customerId = await ensureSaltEdgeCustomer(user, request);
  const today = new Date();
  const from = new Date(today);
  from.setFullYear(today.getFullYear() - 2);

  const response = await saltedgeFetch<SaltEdgeConnectResponse>("/connections/connect", {
    method: "POST",
    body: JSON.stringify({
      data: {
        customer_id: customerId,
        consent: {
          scopes: ["accounts", "transactions"],
          from_date: from.toISOString().slice(0, 10),
          to_date: today.toISOString().slice(0, 10)
        },
        attempt: {
          fetch_scopes: ["accounts", "transactions"],
          fetch_from_date: from.toISOString().slice(0, 10),
          fetch_to_date: today.toISOString().slice(0, 10),
          return_to: `${appUrl()}/api/connectors/bank/callback`,
          locale: "ru",
          store_credentials: true,
          unduplication_strategy: "delete_duplicated"
        },
        widget: {
          template: "default_v3",
          theme: "default",
          show_account_overview: true,
          show_consent_confirmation: true,
          disable_provider_search: false,
          skip_provider_selection: false,
          skip_stages_screen: false,
          allowed_countries: ["KZ", "UZ", "KG", "TJ", "AZ", "AM", "GE", "MD", "UA"],
          popular_providers_country: "KZ"
        },
        provider: {
          include_sandboxes: process.env.TENGEGUARD_BANK_INCLUDE_SANDBOXES === "1"
        },
        return_connection_id: true,
        return_error_class: true,
        automatic_refresh: true,
        categorization: "personal",
        categorization_vendor: "saltedge"
      }
    })
  });

  const state = { ...(await readBankState(user.id, request)), customer_id: response.data.customer_id || customerId };
  await writeBankState(user.id, state);
  return {
    connectUrl: response.data.connect_url,
    state
  };
}

export async function saveBankConnection(userId: string, connectionId: string, request?: Request) {
  const state = await readBankState(userId, request);
  if (!connectionId) return state;
  const next = {
    ...state,
    connections: Array.from(new Set([...state.connections, connectionId]))
  };
  await writeBankState(userId, next);
  return next;
}

async function saltedgeConnections(customerId: string) {
  const response = await saltedgeFetch<SaltEdgeListResponse<SaltEdgeConnection>>(`/connections?customer_id=${encodeURIComponent(customerId)}&per_page=100`);
  return response.data.map((item) => String(item.id || item.connection_id || "")).filter(Boolean);
}

async function saltedgeAccounts(connectionId: string) {
  const response = await saltedgeFetch<SaltEdgeListResponse<SaltEdgeAccount>>(`/accounts?connection_id=${encodeURIComponent(connectionId)}&per_page=100`);
  return response.data.map((item) => String(item.id || item.account_id || "")).filter(Boolean);
}

async function saltedgeTransactions(connectionId: string, accountId: string) {
  const response = await saltedgeFetch<SaltEdgeListResponse<SaltEdgeTransaction>>(
    `/transactions?connection_id=${encodeURIComponent(connectionId)}&account_id=${encodeURIComponent(accountId)}&pending=false&duplicated=false&per_page=1000`
  );
  return response.data;
}

export async function syncBankSubscriptions(user: SessionUser, request?: Request) {
  if (!bankReady()) return { imported: 0, subscriptions_imported: 0 };
  const customerId = await ensureSaltEdgeCustomer(user, request);
  const state = await readBankState(user.id, request);
  const connectionIds = Array.from(new Set([...state.connections, ...(await saltedgeConnections(customerId))]));
  const nextState = { ...state, customer_id: customerId, connections: connectionIds };
  await writeBankState(user.id, nextState);

  const rows: string[] = ["date,description,amount,currency"];
  for (const connectionId of connectionIds) {
    const accounts = await saltedgeAccounts(connectionId);
    for (const accountId of accounts) {
      const transactions = await saltedgeTransactions(connectionId, accountId);
      transactions.forEach((transaction) => {
        const description = transaction.description || transaction.extra?.payee || transaction.extra?.payee_information || "Bank transaction";
        rows.push(
          [
            transaction.made_on || "",
            `"${description.replace(/"/g, '""')}"`,
            transaction.amount || 0,
            transaction.currency_code || "USD"
          ].join(",")
        );
      });
    }
  }

  const result = parseSubscriptionImport(user.id, "saltedge-transactions.csv", rows.join("\n"), "bank");
  await saveImportedSubscriptions(user.id, result.subscriptions);
  return {
    imported: result.imported,
    subscriptions_imported: result.subscriptions.length,
    bank_session: createEncryptedBankSession(user.id, nextState)
  };
}

export async function automaticConnectors(
  user?: SessionUser | null,
  options?: { request?: Request }
): Promise<AutomaticConnector[]> {
  const ready = bankReady() || Boolean(process.env.TENGEGUARD_BANK_CONNECT_URL);
  const bankState = user ? await readBankState(user.id, options?.request) : { connections: [], updated_at: new Date().toISOString() };
  const bankConnected = bankState.connections.length > 0;

  return [
    {
      id: "bank",
      name: bankProviderName(),
      status: bankConnected ? "connected" : ready ? "ready" : "setup_required",
      coverage: "Только чтение счетов и истории транзакций. Без переводов, платежей и списаний.",
      action: bankConnected ? "Банк подключён" : ready ? "Выбрать банк" : "Нужна настройка",
      setup: ready
        ? bankConnected
          ? "История транзакций доступна для поиска регулярных списаний."
          : "Откроется защищённый Salt Edge Connect: выберите банк и подтвердите read-only доступ к истории."
        : "Salt Edge keys are missing in this deployment. Add TENGEGUARD_BANK_PROVIDER_KEY and TENGEGUARD_BANK_PROVIDER_SECRET in Vercel Environment Variables, then redeploy."
    }
  ];
}
