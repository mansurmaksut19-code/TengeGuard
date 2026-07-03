import { NextResponse } from "next/server";
import { ensureTelegramReminderSchedulerStarted, pollTelegramUpdates, sendDueTelegramReminders, sendDueTelegramRemindersForAll } from "@/lib/server/telegram";
import { protectMutation, requireAdminSecret } from "@/lib/server/security";

export async function POST(request: Request) {
  const blocked = protectMutation(request, { key: "telegram-reminders", limit: 10, windowMs: 60_000 });
  if (blocked) return blocked;

  const adminBlocked = requireAdminSecret(request);
  if (adminBlocked) return adminBlocked;

  ensureTelegramReminderSchedulerStarted();
  await pollTelegramUpdates().catch(() => null);

  const body = (await request.json().catch(() => ({}))) as { userId?: string; daysAhead?: number };
  if (!body.userId) {
    const result = await sendDueTelegramRemindersForAll(body.daysAhead ?? 3);
    return NextResponse.json({ ok: true, ...result });
  }

  const result = await sendDueTelegramReminders(body.userId, body.daysAhead ?? 3);
  return NextResponse.json({ ok: true, ...result });
}
