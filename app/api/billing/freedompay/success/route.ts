import { NextResponse } from "next/server";
import { readPaymentOrder, updatePaymentOrder } from "@/lib/server/payments";
import { secureCookieOptions } from "@/lib/server/security";

function appUrl(request: Request) {
  return (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order");
  const order = orderId ? await readPaymentOrder(orderId) : null;

  if (!order) {
    return NextResponse.redirect(`${appUrl(request)}/dashboard?payment=missing_order`);
  }

  order.status = "paid";
  order.paid_at = order.paid_at || new Date().toISOString();
  await updatePaymentOrder(order);

  const response = NextResponse.redirect(`${appUrl(request)}/dashboard?payment=success`);
  response.cookies.set("tg_billing_plan", order.plan, secureCookieOptions(request, 60 * 60 * 24 * 365));
  response.cookies.set("tg_payment_order", order.id, secureCookieOptions(request, 60 * 60 * 24 * 365));
  return response;
}
