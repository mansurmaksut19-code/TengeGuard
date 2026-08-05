import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/server/subcut-gmail";
import { getTelegramStatus } from "@/lib/server/telegram";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  return NextResponse.json(await getTelegramStatus(userId));
}
