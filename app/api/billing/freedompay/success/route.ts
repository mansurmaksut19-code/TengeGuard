import { NextResponse } from "next/server";
import { activatePaidBilling, readPaymentOrder, updatePaymentOrder, verifyFreedomPaySignature } from "@/lib/server/payments";
import { secureCookieOptions } from "@/lib/server/security";

function appUrl(request: Request) {
  return (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const payload = Object.fromEntries(url.searchParams.entries());
  const scriptName = url.pathname.split("/").filter(Boolean).pop() || "success";
  const orderId = url.searchParams.get("pg_order_id") || url.searchParams.get("order");
  const order = orderId ? await readPaymentOrder(orderId) : null;

  if (!order || !verifyFreedomPaySignature(scriptName, payload)) {
    return NextResponse.redirect(`${appUrl(request)}/dashboard?payment=missing_order`);
  }

  order.status = "paid";
  order.paid_at = order.paid_at || new Date().toISOString();
  await updatePaymentOrder(order);
  const billing = await activatePaidBilling(order);

  const startedAt = new Date(billing.started_at);

  const response = NextResponse.redirect(`${appUrl(request)}/dashboard?payment=success`);
  response.cookies.set("tg_billing_plan", order.plan, secureCookieOptions(request, 60 * 60 * 24 * 365 * 2));
  response.cookies.set("tg_billing_started_at", startedAt.toISOString(), secureCookieOptions(request, 60 * 60 * 24 * 365 * 2));
  response.cookies.set("tg_billing_ends_at", billing.ends_at, secureCookieOptions(request, 60 * 60 * 24 * 365 * 2));
  response.cookies.set("tg_payment_order", order.id, secureCookieOptions(request, 60 * 60 * 24 * 365 * 2));
  return response;
}
