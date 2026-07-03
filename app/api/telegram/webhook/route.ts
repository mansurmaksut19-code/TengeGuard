import { NextResponse } from "next/server";
import { handleTelegramUpdate } from "@/lib/server/telegram";

export async function POST(request: Request) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const actualSecret = request.headers.get("x-telegram-bot-api-secret-token");

  if (expectedSecret && actualSecret !== expectedSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await request.json();
  const result = await handleTelegramUpdate(update);
  return NextResponse.json(result);
}
