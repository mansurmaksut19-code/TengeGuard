import crypto from "node:crypto";
import path from "node:path";
import { readStoredJson, writeStoredJson } from "@/lib/server/data-store";
import { storagePath } from "@/lib/server/storage-root";

export type PaidPlan = "pro_monthly" | "pro_yearly";

export type PaymentOrder = {
  id: string;
  user_id: string;
  plan: PaidPlan;
  amount: number;
  currency: "KZT";
  status: "pending" | "paid" | "failed";
  provider: "freedompay";
  created_at: string;
  paid_at?: string;
  provider_payment_id?: string;
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

export async function createPaymentOrder(userId: string, plan: PaidPlan): Promise<PaymentOrder> {
  const details = paidPlanDetails(plan);
  const order: PaymentOrder = {
    id: `tg-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    user_id: userId,
    plan,
    amount: details.amount,
    currency: "KZT",
    status: "pending",
    provider: "freedompay",
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
