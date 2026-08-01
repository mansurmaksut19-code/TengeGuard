import { NextResponse } from "next/server";
import { createFreedomPayCheckout, createPaymentOrder, normalizePaidPlan } from "@/lib/server/payments";
import { getSessionUserFromRequest, getUserIdFromRequest } from "@/lib/server/subcut-gmail";
import { secureCookieOptions } from "@/lib/server/security";

function appUrl(request: Request) {
  return (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const plan = normalizePaidPlan(url.searchParams.get("plan"));
  if (!plan) return NextResponse.redirect(`${appUrl(request)}/?payment=bad_plan`);

  const userId = getUserIdFromRequest(request);
  const user = await getSessionUserFromRequest(request, userId);
  if (!user) {
    const response = NextResponse.redirect(`${appUrl(request)}/api/auth/google`);
    response.cookies.set("tg_pending_checkout_plan", plan, secureCookieOptions(request, 60 * 20));
    response.cookies.set("tg_device_mode", "desktop", secureCookieOptions(request, 60 * 60 * 24 * 365));
    return response;
  }

  const order = await createPaymentOrder(user.id, plan);
  const checkout = await createFreedomPayCheckout(order, appUrl(request));
  if (!checkout.ok) {
    return NextResponse.redirect(`${appUrl(request)}/dashboard?payment=not_configured`);
  }

  return NextResponse.redirect(checkout.redirectUrl);
}
