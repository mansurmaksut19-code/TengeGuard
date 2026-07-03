import type { BillingCycle, Subscription, SubscriptionEvidence, SubscriptionType } from "@/lib/subcut-automation";
import { stableId } from "@/lib/server/subcut-gmail";

type ImportSource = "bank" | "google_takeout" | "apple_export";

type ImportResult = {
  imported: number;
  subscriptions: Subscription[];
  source: ImportSource;
};

type FlatRow = Record<string, string>;

type Transaction = {
  date: string | null;
  description: string;
  amount: number;
  currency: string;
  source: ImportSource;
  raw: FlatRow;
};

const recurringMerchantHints = [
  "adobe",
  "apple",
  "canva",
  "chatgpt",
  "claude",
  "cloudflare",
  "discord",
  "figma",
  "github",
  "google",
  "icloud",
  "netflix",
  "notion",
  "openai",
  "spotify",
  "telegram",
  "vercel",
  "youtube",
  "zoom"
];

const noise = /(?:cashback|refund|reversal|transfer|перевод|возврат|кэшбек|пополнение|atm|наличн|temu|coupon|reward|discount)/i;

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/^\uFEFF/, "").replace(/[^a-zа-яё0-9]+/gi, "");
}

function splitDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === delimiter && !quoted) {
      cells.push(cell.trim());
      cell = "";
      continue;
    }
    cell += char;
  }

  cells.push(cell.trim());
  return cells;
}

function detectDelimiter(text: string) {
  const sample = text.split(/\r?\n/).find((line) => line.trim()) || "";
  const candidates = [",", ";", "\t"];
  return candidates.sort((a, b) => splitDelimitedLine(sample, b).length - splitDelimitedLine(sample, a).length)[0];
}

function parseDelimited(text: string): FlatRow[] {
  const delimiter = detectDelimiter(text);
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = splitDelimitedLine(lines[0], delimiter).map(normalizeHeader);
  return lines.slice(1).map((line) => {
    const cells = splitDelimitedLine(line, delimiter);
    return headers.reduce<FlatRow>((row, header, index) => {
      row[header || `column${index}`] = cells[index] || "";
      return row;
    }, {});
  });
}

function flattenJson(value: unknown): FlatRow[] {
  const rows: FlatRow[] = [];

  function visit(item: unknown) {
    if (Array.isArray(item)) {
      item.forEach(visit);
      return;
    }
    if (!item || typeof item !== "object") return;

    const record = item as Record<string, unknown>;
    const flat: FlatRow = {};
    Object.entries(record).forEach(([key, entry]) => {
      if (entry == null) return;
      if (typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean") {
        flat[normalizeHeader(key)] = String(entry);
      }
    });
    if (Object.keys(flat).length >= 2) rows.push(flat);
    Object.values(record).forEach((entry) => {
      if (typeof entry === "object") visit(entry);
    });
  }

  visit(value);
  return rows;
}

function first(row: FlatRow, names: string[]) {
  for (const name of names) {
    const key = normalizeHeader(name);
    if (row[key]) return row[key];
  }
  return "";
}

function parseAmount(value: string) {
  const clean = value.replace(/\s/g, "").replace(/[₸$€£₽]/g, "").replace(",", ".");
  const match = clean.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function parseDate(value: string) {
  const clean = value.trim();
  const iso = clean.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const dotted = clean.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/);
  if (dotted) return `${dotted[3]}-${dotted[2].padStart(2, "0")}-${dotted[1].padStart(2, "0")}`;
  const date = new Date(clean);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function detectCurrency(row: FlatRow, text: string) {
  const explicit = first(row, ["currency", "валюта", "ccy"]);
  if (/kzt|тенге|₸/i.test(`${explicit} ${text}`)) return "KZT";
  if (/rub|₽/i.test(`${explicit} ${text}`)) return "RUB";
  if (/eur|€/i.test(`${explicit} ${text}`)) return "EUR";
  if (/gbp|£/i.test(`${explicit} ${text}`)) return "GBP";
  return "USD";
}

function cleanMerchant(value: string) {
  return value
    .replace(/\b(?:pos|purchase|card|visa|mastercard|mc|payment|oplata|online|transaction|subscription|recurring)\b/gi, " ")
    .replace(/[*#:_/\\|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

function normalizeMerchant(value: string) {
  return cleanMerchant(value).toLowerCase().replace(/[^a-zа-яё0-9+]+/gi, " ").replace(/\s+/g, " ").trim();
}

function rowsToTransactions(rows: FlatRow[], source: ImportSource): Transaction[] {
  return rows
    .map((row) => {
      const description = first(row, [
        "merchant",
        "merchantName",
        "description",
        "details",
        "name",
        "title",
        "service",
        "операция",
        "описание",
        "назначение",
        "получатель"
      ]);
      const amountRaw = first(row, ["amount", "sum", "total", "price", "cost", "сумма", "итого", "списано"]);
      const amount = parseAmount(amountRaw || description);
      const date = parseDate(first(row, ["date", "transactionDate", "time", "created", "дата", "датаоперации"]));
      const currency = detectCurrency(row, `${description} ${amountRaw}`);

      return {
        date,
        description: cleanMerchant(description),
        amount,
        currency,
        source,
        raw: row
      };
    })
    .filter((item) => item.description && Math.abs(item.amount) > 0 && !noise.test(item.description));
}

function daysBetween(a: string, b: string) {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86_400_000;
}

function detectCycle(dates: string[]): BillingCycle {
  if (dates.length < 2) return "unknown";
  const sorted = dates.slice().sort();
  const intervals = sorted.slice(1).map((date, index) => daysBetween(date, sorted[index]));
  const average = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
  if (average >= 5 && average <= 10) return "weekly";
  if (average >= 24 && average <= 38) return "monthly";
  if (average >= 330 && average <= 400) return "yearly";
  return "unknown";
}

function nextDateFromCycle(date: string | null, cycle: BillingCycle) {
  if (!date || cycle === "unknown") return null;
  const next = new Date(date);
  if (cycle === "weekly") next.setDate(next.getDate() + 7);
  if (cycle === "monthly") next.setMonth(next.getMonth() + 1);
  if (cycle === "yearly") next.setFullYear(next.getFullYear() + 1);
  return next.toISOString().slice(0, 10);
}

function buildEvidence(transaction: Transaction): SubscriptionEvidence {
  return {
    source: transaction.source,
    subject: transaction.description,
    from: transaction.source === "bank" ? "Bank statement" : transaction.source === "google_takeout" ? "Google Takeout" : "Apple export",
    date: transaction.date || undefined,
    snippet: `${transaction.description} · ${Math.abs(transaction.amount)} ${transaction.currency}`,
    matched_signals: transaction.source === "bank" ? ["payment", "recurring"] : ["receipt", "payment"]
  };
}

function transactionsToSubscriptions(userId: string, transactions: Transaction[], source: ImportSource): Subscription[] {
  const groups = new Map<string, Transaction[]>();
  transactions.forEach((transaction) => {
    const key = normalizeMerchant(transaction.description);
    if (!key || key.length < 3) return;
    groups.set(key, [...(groups.get(key) || []), transaction]);
  });

  const subscriptions: Subscription[] = [];
  groups.forEach((items, key) => {
    const dated = items.filter((item) => item.date).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const latest = dated[dated.length - 1] || items[items.length - 1];
    const dates = dated.map((item) => item.date).filter(Boolean) as string[];
    const cycle = detectCycle(dates);
    const merchantHint = recurringMerchantHints.some((hint) => key.includes(hint));
    const repeated = items.length >= 2 && (cycle !== "unknown" || merchantHint);
    const takeoutLike = source !== "bank" && (merchantHint || /subscription|recurring|renewal|подписк/i.test(JSON.stringify(latest.raw)));
    if (!repeated && !takeoutLike) return;

    const confidence = repeated && items.length >= 3 ? 0.82 : repeated ? 0.72 : 0.62;
    const providerName = cleanMerchant(latest.description).replace(/\b\w/g, (letter) => letter.toUpperCase());

    subscriptions.push({
      id: `sub_${stableId(`${userId}:${source}:${key}`)}`,
      user_id: userId,
      provider_name: providerName,
      cost: Math.abs(latest.amount),
      currency: latest.currency,
      billing_cycle: cycle,
      next_billing_date: nextDateFromCycle(latest.date, cycle),
      status: confidence >= 0.7 ? "active" : "review",
      type: "paid" satisfies SubscriptionType,
      trial_ends_at: null,
      cancellation_path: `https://www.google.com/search?q=${encodeURIComponent(`cancel ${providerName} subscription`)}`,
      confidence,
      evidence: items.slice(-6).map(buildEvidence),
      last_seen_at: new Date().toISOString()
    });
  });

  return subscriptions;
}

export function parseSubscriptionImport(userId: string, fileName: string, text: string, requestedSource?: string): ImportResult {
  const source: ImportSource =
    requestedSource === "google_takeout" || /takeout|google/i.test(fileName)
      ? "google_takeout"
      : requestedSource === "apple_export" || /apple|appstore|itunes/i.test(fileName)
        ? "apple_export"
        : "bank";
  const trimmed = text.trim();
  const rows = trimmed.startsWith("{") || trimmed.startsWith("[") ? flattenJson(JSON.parse(trimmed)) : parseDelimited(text);
  const transactions = rowsToTransactions(rows, source);
  const subscriptions = transactionsToSubscriptions(userId, transactions, source);

  return {
    imported: transactions.length,
    subscriptions,
    source
  };
}
