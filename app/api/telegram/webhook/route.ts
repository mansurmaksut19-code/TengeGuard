import { NextResponse } from "next/server";
import { handleTelegramUpdate } from "@/lib/server/telegram";
import { requireTelegramSecret } from "@/lib/server/security";

export async function POST(request: Request) {
  const blocked = requireTelegramSecret(request);
  if (blocked) return blocked;

  const update = await request.json();
  const result = await handleTelegramUpdate(update);
  return NextResponse.json(result);
}
