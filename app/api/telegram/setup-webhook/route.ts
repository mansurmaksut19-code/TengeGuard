import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN is not configured" }, { status: 400 });

  const cronSecret = process.env.TENGEGUARD_CRON_SECRET;
  if (cronSecret && request.headers.get("x-tengeguard-cron-secret") !== cronSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

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
