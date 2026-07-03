import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/server/subcut-gmail";
import { ensureTelegramBotCommands, ensureTelegramReminderSchedulerStarted, getTelegramStatus, pollTelegramUpdates } from "@/lib/server/telegram";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  ensureTelegramReminderSchedulerStarted();
  await pollTelegramUpdates().catch(() => null);
  await ensureTelegramBotCommands().catch(() => null);
  return NextResponse.json(await getTelegramStatus(userId));
}
