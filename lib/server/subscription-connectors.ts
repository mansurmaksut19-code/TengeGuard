import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseSubscriptionImport } from "@/lib/server/subscription-import";
import { storagePath } from "@/lib/server/storage-root";
import { readTokens, saveImportedSubscriptions, type SessionUser } from "@/lib/server/subcut-gmail";

type ConnectorStatus = "connected" | "ready" | "setup_required" | "not_available";

export type AutomaticConnector = {
  id: "gmail" | "bank" | "google_account" | "apple";
  name: string;
  status: ConnectorStatus;
  coverage: string;
  action: string;
  setup?: string;
};

function bankProviderName() {
  return process.env.TENGEGUARD_BANK_PROVIDER || "Open Banking provider";
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

function statePath(userId: string) {
  return path.join(bankStateRoot, `${userId}.json`);
}

async function readBankState(userId: string): Promise<SaltEdgeState> {
  try {
    return JSON.parse(await readFile(statePath(userId), "utf8")) as SaltEdgeState;
  } catch {
    return { connections: [], updated_at: new Date().toISOString() };
  }
}

async function writeBankState(userId: string, state: SaltEdgeState) {
  await mkdir(bankStateRoot, { recursive: true });
  const filePath = statePath(userId);
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, JSON.stringify({ ...state, updated_at: new Date().toISOString() }, null, 2), "utf8");
  await rename(tempPath, filePath);
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

async function ensureSaltEdgeCustomer(user: SessionUser) {
  const state = await readBankState(user.id);
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
  if (!bankReady()) return bankConnectUrl(user);
  const customerId = await ensureSaltEdgeCustomer(user);
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
          return_to: `${appUrl()}/dashboard/subscriptions`,
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
          skip_stages_screen: true,
          allowed_countries: ["XF", "KZ", "UZ", "KG", "AZ", "AM", "GE", "MD"],
          popular_providers_country: "XF"
        },
        provider: {
          include_sandboxes: true
        },
        return_connection_id: true,
        return_error_class: true,
        automatic_refresh: true,
        categorization: "personal",
        categorization_vendor: "saltedge"
      }
    })
  });

  await writeBankState(user.id, { ...(await readBankState(user.id)), customer_id: response.data.customer_id });
  return response.data.connect_url;
}

export async function saveBankConnection(userId: string, connectionId: string) {
  if (!connectionId) return;
  const state = await readBankState(userId);
  await writeBankState(userId, {
    ...state,
    connections: Array.from(new Set([...state.connections, connectionId]))
  });
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

export async function syncBankSubscriptions(user: SessionUser) {
  if (!bankReady()) return { imported: 0, subscriptions_imported: 0 };
  const customerId = await ensureSaltEdgeCustomer(user);
  const state = await readBankState(user.id);
  const connectionIds = Array.from(new Set([...state.connections, ...(await saltedgeConnections(customerId))]));
  await writeBankState(user.id, { ...state, customer_id: customerId, connections: connectionIds });

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
    subscriptions_imported: result.subscriptions.length
  };
}

export async function automaticConnectors(
  user?: SessionUser | null,
  options?: { gmailConnected?: boolean }
): Promise<AutomaticConnector[]> {
  const gmailTokens = await readTokens(user?.id);
  const gmailConnected = options?.gmailConnected || Boolean(gmailTokens);
  const ready = bankReady() || Boolean(process.env.TENGEGUARD_BANK_CONNECT_URL);

  return [
    {
      id: "gmail",
      name: "Gmail read-only",
      status: gmailConnected ? "connected" : "ready",
      coverage: "Receipts, trials, free plans, Google Play emails, renewal notices.",
      action: gmailConnected ? "Connected" : "Connect Google"
    },
    {
      id: "bank",
      name: bankProviderName(),
      status: ready ? "ready" : "setup_required",
      coverage: "Card and account transactions, recurring payments, subscriptions without emails.",
      action: ready ? "Connect bank" : "Founder setup required",
      setup: ready
        ? undefined
        : "Set Salt Edge App-id and Secret in TENGEGUARD_BANK_PROVIDER_KEY / TENGEGUARD_BANK_PROVIDER_SECRET."
    },
    {
      id: "google_account",
      name: "Google Payments / Play",
      status: "not_available",
      coverage: "Google Account can show purchases and subscriptions, but Google does not provide a general public OAuth API for every user's consumer subscriptions.",
      action: "Use Gmail now; add official provider when available",
      setup: "For full Google purchase history without user export, you need an approved Google/Payments integration or a compliant data-access partner."
    },
    {
      id: "apple",
      name: "Apple subscriptions",
      status: "not_available",
      coverage: "Apple subscriptions bought through App Store are visible to the user in Apple Account settings.",
      action: "Official universal third-party access is not available",
      setup: "App Store Server API gives subscription status for your own apps, not every subscription in a user's Apple ID."
    }
  ];
}
