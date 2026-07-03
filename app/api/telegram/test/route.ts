import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/server/subcut-gmail";
import { ensureTelegramReminderSchedulerStarted, pollTelegramUpdates, sendTelegramDigest } from "@/lib/server/telegram";

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  ensureTelegramReminderSchedulerStarted();
  await pollTelegramUpdates().catch(() => null);
  const result = await sendTelegramDigest(userId);
  if (!result.sent) {
    return NextResponse.json({ ok: false, error: "Telegram is not connected yet", ...result }, { status: 409 });
  }

  return NextResponse.json({ ok: true, ...result });
}
