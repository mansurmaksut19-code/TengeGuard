import { NextResponse } from "next/server";
import { exchangeGmailCode } from "@/lib/server/subcut-gmail";
import { secureCookieOptions } from "@/lib/server/security";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    url.pathname = "/dashboard";
    url.search = "?gmail=missing_code";
    return NextResponse.redirect(url);
  }

  try {
    const user = await exchangeGmailCode(code, url.origin);
    url.pathname = "/dashboard";
    url.search = "?gmail=connected";
    const response = NextResponse.redirect(url);
    response.cookies.set("tg_user_id", user.id, {
      ...secureCookieOptions(request, 60 * 60 * 24 * 30)
    });
    response.cookies.set("tg_gmail_connected", "1", {
      ...secureCookieOptions(request, 60 * 60 * 24 * 30)
    });
    return response;
  } catch (error) {
    console.error("[TengeGuard Gmail OAuth] Callback failed:", error instanceof Error ? error.message : error);
    url.pathname = "/dashboard";
    url.search = `?gmail=sync_failed&reason=${encodeURIComponent(error instanceof Error ? error.message : "unknown")}`;
    return NextResponse.redirect(url);
  }
}
