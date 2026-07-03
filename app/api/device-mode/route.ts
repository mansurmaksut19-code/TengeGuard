import { NextResponse } from "next/server";
import { secureCookieOptions } from "@/lib/server/security";

type DeviceMode = "mobile" | "desktop";

function normalizeMode(value: string | null): DeviceMode | null {
  if (value === "mobile" || value === "desktop") return value;
  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = normalizeMode(url.searchParams.get("mode"));

  if (!mode) {
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  url.pathname = "/auth/gmail";
  url.search = "";

  const response = NextResponse.redirect(url);
  response.cookies.set("tg_device_mode", mode, {
    ...secureCookieOptions(request, 60 * 60 * 24 * 365)
  });

  return response;
}
