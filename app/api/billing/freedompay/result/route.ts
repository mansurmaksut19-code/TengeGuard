import { NextResponse } from "next/server";
import { readPaymentOrder, updatePaymentOrder } from "@/lib/server/payments";

async function readPayload(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return (await request.json().catch(() => ({}))) as Record<string, string>;
  const form = await request.formData().catch(() => null);
  if (!form) return {};
  return Object.fromEntries(Array.from(form.entries()).map(([key, value]) => [key, String(value)]));
}

export async function POST(request: Request) {
  const payload = await readPayload(request);
  const orderId = payload.pg_order_id;
  const order = orderId ? await readPaymentOrder(orderId) : null;
  if (!order) {
    return new NextResponse("<?xml version=\"1.0\"?><response><pg_status>rejected</pg_status><pg_description>order not found</pg_description></response>", {
      headers: { "Content-Type": "application/xml" }
    });
  }

  const paymentStatus = payload.pg_payment_status || payload.pg_status;
  order.status = paymentStatus === "ok" || paymentStatus === "success" ? "paid" : paymentStatus === "failed" ? "failed" : order.status;
  order.provider_payment_id = payload.pg_payment_id || order.provider_payment_id;
  if (order.status === "paid") order.paid_at = order.paid_at || new Date().toISOString();
  await updatePaymentOrder(order);

  return new NextResponse("<?xml version=\"1.0\"?><response><pg_status>ok</pg_status><pg_description>accepted</pg_description></response>", {
    headers: { "Content-Type": "application/xml" }
  });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
