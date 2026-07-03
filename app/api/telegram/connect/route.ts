import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/server/subcut-gmail";
import { createTelegramConnectUrl, ensureTelegramBotCommands, ensureTelegramReminderSchedulerStarted, getTelegramStatus, pollTelegramUpdates } from "@/lib/server/telegram";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  ensureTelegramReminderSchedulerStarted();
  await pollTelegramUpdates().catch(() => null);
  await ensureTelegramBotCommands().catch(() => null);

  if (!userId) {
    return NextResponse.redirect(`${appUrl.replace(/\/$/, "")}/dashboard?telegram=missing_user`);
  }

  const status = await getTelegramStatus(userId);
  if (!status.configured) {
    return NextResponse.redirect(`${appUrl.replace(/\/$/, "")}/dashboard?telegram=not_configured`);
  }

  return NextResponse.redirect(await createTelegramConnectUrl(userId));
}
