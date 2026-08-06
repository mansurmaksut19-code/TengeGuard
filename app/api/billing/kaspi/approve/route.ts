import { NextResponse } from "next/server";
import { activatePaidBilling, readPaymentOrder, updatePaymentOrder } from "@/lib/server/payments";
import { requireAdminSecret } from "@/lib/server/security";

async function readOrderId(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as { order?: string };
    return body.order || "";
  }

  const form = await request.formData().catch(() => null);
  return form ? String(form.get("order") || "") : new URL(request.url).searchParams.get("order") || "";
}

export async function POST(request: Request) {
  const blocked = requireAdminSecret(request);
  if (blocked) return blocked;

  const orderId = await readOrderId(request);
  const order = orderId ? await readPaymentOrder(orderId) : null;
  if (!order || order.provider !== "kaspi_pay") {
    return NextResponse.json({ ok: false, error: "Kaspi Pay order not found" }, { status: 404 });
  }

  order.status = "paid";
  order.paid_at = order.paid_at || new Date().toISOString();
  await updatePaymentOrder(order);
  const billing = await activatePaidBilling(order);

  return NextResponse.json({ ok: true, order, billing });
}
