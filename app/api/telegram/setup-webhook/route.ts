import { NextResponse } from "next/server";
import { protectMutation, requireAdminSecret } from "@/lib/server/security";
import { ensureTelegramBotCommands, ensureTelegramWebhook } from "@/lib/server/telegram";

export async function POST(request: Request) {
  const blocked = protectMutation(request, { key: "telegram-setup-webhook", limit: 5, windowMs: 60_000 });
  if (blocked) return blocked;

  const adminBlocked = requireAdminSecret(request);
  if (adminBlocked) return adminBlocked;

  try {
    const webhook = await ensureTelegramWebhook();
    const profile = await ensureTelegramBotCommands();
    return NextResponse.json({ ok: true, webhook, profile });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Telegram setup failed" },
      { status: 502 }
    );
  }
}
