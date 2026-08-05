import { NextResponse } from "next/server";
import { protectMutation } from "@/lib/server/security";
import { getUserIdFromRequest } from "@/lib/server/subcut-gmail";
import { sendTelegramDigest } from "@/lib/server/telegram";

export async function POST(request: Request) {
  const blocked = protectMutation(request, { key: "telegram-test", limit: 10, windowMs: 60_000 });
  if (blocked) return blocked;

  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const result = await sendTelegramDigest(userId);
  if (!result.sent) {
    return NextResponse.json({ ok: false, error: "Telegram is not connected yet", ...result }, { status: 409 });
  }

  return NextResponse.json({ ok: true, ...result });
}
