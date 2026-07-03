import { NextResponse } from "next/server";
import { ensureTelegramReminderSchedulerStarted, pollTelegramUpdates, sendDueTelegramReminders, sendDueTelegramRemindersForAll } from "@/lib/server/telegram";

export async function POST(request: Request) {
  ensureTelegramReminderSchedulerStarted();
  await pollTelegramUpdates().catch(() => null);

  const cronSecret = process.env.TENGEGUARD_CRON_SECRET;
  if (cronSecret && request.headers.get("x-tengeguard-cron-secret") !== cronSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { userId?: string; daysAhead?: number };
  if (!body.userId) {
    const result = await sendDueTelegramRemindersForAll(body.daysAhead ?? 3);
    return NextResponse.json({ ok: true, ...result });
  }

  const result = await sendDueTelegramReminders(body.userId, body.daysAhead ?? 3);
  return NextResponse.json({ ok: true, ...result });
}
