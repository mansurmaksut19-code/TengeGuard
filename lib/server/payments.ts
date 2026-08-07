import crypto from "node:crypto";
import path from "node:path";
import { readStoredJson, writeStoredJson } from "@/lib/server/data-store";
import { storagePath } from "@/lib/server/storage-root";

export type PaidPlan = "pro_monthly" | "pro_yearly";

export type BillingState = {
  user_id: string;
  plan: PaidPlan | "free";
  status: "trial" | "active" | "expired";
  started_at: string;
  ends_at: string;
  provider?: PaymentOrder["provider"];
  order_id?: string;
};

export type PaymentOrder = {
  id: string;
  user_id: string;
  plan: PaidPlan;
  amount: number;
  currency: "KZT";
  status: "pending" | "awaiting_confirmation" | "paid" | "failed";
  provider: "freedompay" | "kaspi_pay";
  created_at: string;
  confirmed_at?: string;
  paid_at?: string;
  provider_payment_id?: string;
  customer_note?: string;
};

type FreedomPayConfig = {
  merchantId: string;
  secretKey: string;
  apiUrl: string;
  testingMode: boolean;
};

export function paidPlanDetails(plan: PaidPlan) {
  return plan === "pro_yearly"
    ? { amount: 2000, label: "TengeGuard Pro yearly" }
    : { amount: 200, label: "TengeGuard Pro monthly" };
}

export function normalizePaidPlan(value: string | null): PaidPlan | null {
  return value === "pro_monthly" || value === "pro_yearly" ? value : null;
}

export function readFreedomPayConfig(): FreedomPayConfig | null {
  const merchantId = process.env.FREEDOMPAY_MERCHANT_ID || process.env.TENGEGUARD_FREEDOMPAY_MERCHANT_ID;
  const secretKey = process.env.FREEDOMPAY_SECRET_KEY || process.env.TENGEGUARD_FREEDOMPAY_SECRET_KEY;
  if (!merchantId || !secretKey) return null;

  return {
    merchantId,
    secretKey,
    apiUrl: (process.env.FREEDOMPAY_API_URL || "https://api.freedompay.kz").replace(/\/$/, ""),
    testingMode: process.env.FREEDOMPAY_TESTING_MODE === "1"
  };
}

function ordersRoot() {
  return storagePath("payments");
}

function orderPath(orderId: string) {
  return path.join(ordersRoot(), `${orderId}.json`);
}

function billingPath(userId: string) {
  return path.join(storagePath("billing"), `${userId}.json`);
}

export function billingEndDate(plan: PaidPlan, startedAt = new Date()) {
  const endsAt = new Date(startedAt);
  if (plan === "pro_yearly") endsAt.setUTCFullYear(endsAt.getUTCFullYear() + 1);
  else endsAt.setUTCMonth(endsAt.getUTCMonth() + 1);
  return endsAt;
}

export function trialEndDate(startedAt = new Date()) {
  const endsAt = new Date(startedAt);
  endsAt.setUTCDate(endsAt.getUTCDate() + 14);
  return endsAt;
}

export async function readBillingState(userId?: string) {
  if (!userId) return null;
  return readStoredJson<BillingState>(billingPath(userId));
}

export async function ensureTrialBillingState(userId: string, startedAtValue?: string | null) {
  const existing = await readBillingState(userId);
  if (existing) return existing;

  const parsedStart = startedAtValue ? new Date(startedAtValue) : null;
  const startedAt = parsedStart && Number.isFinite(parsedStart.getTime()) ? parsedStart : new Date();
  const billing: BillingState = {
    user_id: userId,
    plan: "free",
    status: trialEndDate(startedAt).getTime() > Date.now() ? "trial" : "expired",
    started_at: startedAt.toISOString(),
    ends_at: trialEndDate(startedAt).toISOString()
  };
  await writeStoredJson(billingPath(userId), billing);
  return billing;
}

export async function setTrialDaysRemaining(userId: string, days: number) {
  const normalizedDays = Math.max(0, Math.min(14, Math.floor(days)));
  const now = new Date();
  const endsAt = new Date(now);
  endsAt.setUTCDate(endsAt.getUTCDate() + normalizedDays);
  const startedAt = new Date(endsAt);
  startedAt.setUTCDate(startedAt.getUTCDate() - 14);

  const billing: BillingState = {
    user_id: userId,
    plan: "free",
    status: normalizedDays > 0 ? "trial" : "expired",
    started_at: startedAt.toISOString(),
    ends_at: endsAt.toISOString()
  };
  await writeStoredJson(billingPath(userId), billing);
  return billing;
}

export async function cancelBillingState(userId: string) {
  const now = new Date();
  await writeStoredJson(billingPath(userId), {
    user_id: userId,
    plan: "free",
    status: "expired",
    started_at: now.toISOString(),
    ends_at: now.toISOString()
  } satisfies BillingState);
}

export async function activatePaidBilling(order: PaymentOrder) {
  const startedAt = order.paid_at ? new Date(order.paid_at) : new Date();
  const billing: BillingState = {
    user_id: order.user_id,
    plan: order.plan,
    status: "active",
    started_at: startedAt.toISOString(),
    ends_at: billingEndDate(order.plan, startedAt).toISOString(),
    provider: order.provider,
    order_id: order.id
  };
  await writeStoredJson(billingPath(order.user_id), billing);
  return billing;
}

export async function createPaymentOrder(userId: string, plan: PaidPlan, provider: PaymentOrder["provider"] = "freedompay"): Promise<PaymentOrder> {
  const details = paidPlanDetails(plan);
  const order: PaymentOrder = {
    id: `tg-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    user_id: userId,
    plan,
    amount: details.amount,
    currency: "KZT",
    status: "pending",
    provider,
    created_at: new Date().toISOString()
  };

  await writeStoredJson(orderPath(order.id), order);
  return order;
}

export async function readPaymentOrder(orderId: string) {
  return readStoredJson<PaymentOrder>(orderPath(orderId));
}

export async function updatePaymentOrder(order: PaymentOrder) {
  await writeStoredJson(orderPath(order.id), order);
}

export type KaspiPayConfig = {
  merchantName: string;
  phone: string;
  paymentUrl?: string;
  qrImageUrl?: string;
};

export function readKaspiPayConfig(): KaspiPayConfig | null {
  const phone = process.env.KASPI_PAY_PHONE || process.env.TENGEGUARD_KASPI_PAY_PHONE;
  if (!phone) return null;

  return {
    merchantName: process.env.KASPI_PAY_MERCHANT_NAME || process.env.TENGEGUARD_KASPI_PAY_MERCHANT_NAME || "TengeGuard",
    phone,
    paymentUrl: process.env.KASPI_PAY_PAYMENT_URL || process.env.TENGEGUARD_KASPI_PAY_PAYMENT_URL || undefined,
    qrImageUrl: process.env.KASPI_PAY_QR_IMAGE_URL || process.env.TENGEGUARD_KASPI_PAY_QR_IMAGE_URL || undefined
  };
}

function freedomPaySignature(scriptName: string, params: Record<string, string>, secretKey: string) {
  const values = Object.entries(params)
    .filter(([key]) => key !== "pg_sig")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value);
  return crypto.createHash("md5").update([scriptName, ...values, secretKey].join(";")).digest("hex");
}

export function verifyFreedomPaySignature(scriptName: string, params: Record<string, string>) {
  const config = readFreedomPayConfig();
  const received = params.pg_sig;
  if (!config || !received) return false;

  const expected = freedomPaySignature(scriptName, params, config.secretKey);
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received.toLowerCase());
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;"
  })[character] || character);
}

export function freedomPayXmlResponse(scriptName: string, fields: Record<string, string>) {
  const config = readFreedomPayConfig();
  const params: Record<string, string> = { ...fields, pg_salt: crypto.randomBytes(8).toString("hex") };
  if (config) params.pg_sig = freedomPaySignature(scriptName, params, config.secretKey);
  const body = Object.entries(params).map(([key, value]) => `<${key}>${escapeXml(value)}</${key}>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><response>${body}</response>`;
}

function xmlValue(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match?.[1]?.trim() || null;
}

export async function createFreedomPayCheckout(order: PaymentOrder, appUrl: string) {
  const config = readFreedomPayConfig();
  if (!config) {
    return { ok: false as const, reason: "Freedom Pay merchant credentials are not configured." };
  }

  const details = paidPlanDetails(order.plan);
  const params: Record<string, string> = {
    pg_order_id: order.id,
    pg_merchant_id: config.merchantId,
    pg_amount: String(order.amount),
    pg_currency: order.currency,
    pg_description: details.label,
    pg_salt: crypto.randomBytes(8).toString("hex"),
    pg_user_id: order.user_id,
    pg_result_url: `${appUrl}/api/billing/freedompay/result`,
    pg_success_url: `${appUrl}/api/billing/freedompay/success?order=${encodeURIComponent(order.id)}`,
    pg_failure_url: `${appUrl}/dashboard?payment=failed`
  };

  if (config.testingMode) params.pg_testing_mode = "1";

  params.pg_sig = freedomPaySignature("init_payment.php", params, config.secretKey);

  const form = new FormData();
  Object.entries(params).forEach(([key, value]) => form.append(key, value));

  const response = await fetch(`${config.apiUrl}/init_payment.php`, {
    method: "POST",
    body: form
  });
  const body = await response.text();
  const redirectUrl = xmlValue(body, "pg_redirect_url");
  const paymentId = xmlValue(body, "pg_payment_id");
  const status = xmlValue(body, "pg_status");

  if (!response.ok || status !== "ok" || !redirectUrl) {
    return { ok: false as const, reason: xmlValue(body, "pg_error_description") || "Freedom Pay did not create a payment page." };
  }

  order.provider_payment_id = paymentId || undefined;
  await updatePaymentOrder(order);

  return { ok: true as const, redirectUrl };
}
