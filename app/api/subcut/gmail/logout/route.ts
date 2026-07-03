import { NextResponse } from "next/server";
import { protectMutation, secureCookieOptions } from "@/lib/server/security";

export async function POST(request: Request) {
  const blocked = protectMutation(request, { key: "gmail-logout", limit: 20, windowMs: 60_000 });
  if (blocked) return blocked;

  const response = NextResponse.json({ ok: true });
  response.cookies.set("tg_user_id", "", {
    ...secureCookieOptions(request, 0)
  });
  response.cookies.set("tg_gmail_connected", "", {
    ...secureCookieOptions(request, 0)
  });
  return response;
}
