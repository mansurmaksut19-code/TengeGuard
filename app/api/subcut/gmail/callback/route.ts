import { NextResponse } from "next/server";
import {
  createEncryptedGmailSession,
  createEncryptedUserSession,
  exchangeGmailCode,
  exchangeGoogleSignInCode,
  getGmailSessionCookieName,
  getUserSessionCookieName,
  readTokens
} from "@/lib/server/subcut-gmail";
import { secureCookieOptions } from "@/lib/server/security";

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
      url.pathname = "/dashboard";
      url.search = "?signin=connected";
      const response = NextResponse.redirect(url);
      response.cookies.set("tg_user_id", user.id, {
        ...secureCookieOptions(request, 60 * 60 * 24 * 30)
      });
      response.cookies.set(getUserSessionCookieName(), createEncryptedUserSession(user), {
        ...secureCookieOptions(request, 60 * 60 * 24 * 30)
      });
      return response;
    }

    const user = await exchangeGmailCode(code, url.origin);
    url.pathname = "/dashboard";
    url.search = "?gmail=connected";
    const response = NextResponse.redirect(url);
    response.cookies.set("tg_user_id", user.id, {
      ...secureCookieOptions(request, 60 * 60 * 24 * 30)
    });
    response.cookies.set(getUserSessionCookieName(), createEncryptedUserSession(user), {
      ...secureCookieOptions(request, 60 * 60 * 24 * 30)
    });
    response.cookies.set("tg_gmail_connected", "1", {
      ...secureCookieOptions(request, 60 * 60 * 24 * 30)
    });
    const tokens = await readTokens(user.id);
    if (tokens) {
      response.cookies.set(getGmailSessionCookieName(), createEncryptedGmailSession(tokens), {
        ...secureCookieOptions(request, 60 * 60 * 24 * 30)
      });
    }
    return response;
  } catch (error) {
    console.error("[TengeGuard Gmail OAuth] Callback failed:", error instanceof Error ? error.message : error);
    url.pathname = "/dashboard";
    url.search = `?gmail=sync_failed&reason=${encodeURIComponent(error instanceof Error ? error.message : "unknown")}`;
    return NextResponse.redirect(url);
  }
}
