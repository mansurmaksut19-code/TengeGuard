import { NextResponse } from "next/server";
import {
  createEncryptedUserSession,
  exchangeGoogleSignInCode,
  getUserSessionCookieName
} from "@/lib/server/subcut-gmail";
import { secureCookieOptions } from "@/lib/server/security";

function readCookie(request: Request, name: string) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    url.pathname = "/dashboard";
    url.search = "?gmail=missing_code";
    return NextResponse.redirect(url);
  }

  try {
    if (state === "tengeguard:signin") {
      const user = await exchangeGoogleSignInCode(code, url.origin);
      const pendingCheckoutPlan = readCookie(request, "tg_pending_checkout_plan");
      if (pendingCheckoutPlan === "pro_monthly" || pendingCheckoutPlan === "pro_yearly") {
        url.pathname = "/api/billing/checkout";
        url.search = `?plan=${pendingCheckoutPlan}`;
      } else {
        url.pathname = "/dashboard";
        url.search = "?signin=connected";
      }
      const response = NextResponse.redirect(url);
      response.cookies.set("tg_user_id", user.id, {
        ...secureCookieOptions(request, 60 * 60 * 24 * 30)
      });
      response.cookies.set(getUserSessionCookieName(), createEncryptedUserSession(user), {
        ...secureCookieOptions(request, 60 * 60 * 24 * 30)
      });
      if (pendingCheckoutPlan) {
        response.cookies.set("tg_pending_checkout_plan", "", {
          ...secureCookieOptions(request, 0)
        });
      }
      return response;
    }

    url.pathname = "/api/auth/google";
    url.search = "";
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("[TengeGuard Google OAuth] Callback failed:", error instanceof Error ? error.message : error);
    url.pathname = "/dashboard";
    url.search = `?signin=failed&reason=${encodeURIComponent(error instanceof Error ? error.message : "unknown")}`;
    return NextResponse.redirect(url);
  }
}
