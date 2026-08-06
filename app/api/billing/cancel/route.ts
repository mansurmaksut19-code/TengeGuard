import { NextResponse } from "next/server";
import { cancelBillingState } from "@/lib/server/payments";
import { protectMutation, secureCookieOptions } from "@/lib/server/security";
import { getSessionUserFromRequest, getUserIdFromRequest } from "@/lib/server/subcut-gmail";

function appUrl(request: Request) {
  return (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
}

export async function POST(request: Request) {
  const blocked = protectMutation(request, { key: "billing-cancel", limit: 8, windowMs: 60_000 });
  if (blocked) return blocked;

  const userId = getUserIdFromRequest(request);
  const user = await getSessionUserFromRequest(request, userId);
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  await cancelBillingState(user.id);

  const response = NextResponse.redirect(`${appUrl(request)}/dashboard/account?billing=cancelled`);
  response.cookies.set("tg_billing_plan", "free", secureCookieOptions(request, 60 * 60 * 24 * 365 * 2));
  response.cookies.set("tg_billing_started_at", "", secureCookieOptions(request, 0));
  response.cookies.set("tg_billing_ends_at", "", secureCookieOptions(request, 0));
  response.cookies.set("tg_payment_order", "", secureCookieOptions(request, 0));
  return response;
}
