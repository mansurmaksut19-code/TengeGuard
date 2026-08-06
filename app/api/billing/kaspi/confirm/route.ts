import { NextResponse } from "next/server";
import { readPaymentOrder, updatePaymentOrder } from "@/lib/server/payments";
import { protectMutation } from "@/lib/server/security";
import { getSessionUserFromRequest, getUserIdFromRequest } from "@/lib/server/subcut-gmail";

function appUrl(request: Request) {
  return (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
}

export async function POST(request: Request) {
  const blocked = protectMutation(request, { key: "kaspi-payment-confirm", limit: 10, windowMs: 60_000 });
  if (blocked) return blocked;

  const form = await request.formData().catch(() => null);
  const orderId = form ? String(form.get("order") || "") : "";
  const order = orderId ? await readPaymentOrder(orderId) : null;
  const userId = getUserIdFromRequest(request);
  const user = await getSessionUserFromRequest(request, userId);

  if (!order || order.provider !== "kaspi_pay" || !user || order.user_id !== user.id) {
    return NextResponse.redirect(`${appUrl(request)}/dashboard/account?payment=missing_order`);
  }

  if (order.status === "pending") {
    order.status = "awaiting_confirmation";
    order.confirmed_at = new Date().toISOString();
    await updatePaymentOrder(order);
  }

  return NextResponse.redirect(`${appUrl(request)}/billing/kaspi?order=${encodeURIComponent(order.id)}&submitted=1`);
}
