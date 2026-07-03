import { NextResponse } from "next/server";
import { protectMutation, requireAdminSecret } from "@/lib/server/security";

export async function POST(request: Request) {
  const blocked = protectMutation(request, { key: "telegram-setup-webhook", limit: 5, windowMs: 60_000 });
  if (blocked) return blocked;

  const adminBlocked = requireAdminSecret(request);
  if (adminBlocked) return adminBlocked;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN is not configured" }, { status: 400 });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
  const webhookUrl = `${appUrl}/api/telegram/webhook`;
  const body: Record<string, string> = { url: webhookUrl };
  if (process.env.TELEGRAM_WEBHOOK_SECRET) body.secret_token = process.env.TELEGRAM_WEBHOOK_SECRET;

  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const result = await response.json().catch(() => null);
  return NextResponse.json({ ok: response.ok, webhookUrl, result }, { status: response.ok ? 200 : 502 });
}
