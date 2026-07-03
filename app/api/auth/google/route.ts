import { NextResponse } from "next/server";
import { buildGmailConnectUrl } from "@/lib/server/subcut-gmail";

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    return NextResponse.redirect(buildGmailConnectUrl(url.origin));
  } catch (error) {
    console.error(
      "[TengeGuard Gmail OAuth] Auth route failed:",
      error instanceof Error ? error.message : "Unknown Google OAuth auth route error"
    );
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }
}
