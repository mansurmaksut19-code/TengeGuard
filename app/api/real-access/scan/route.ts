import { NextResponse } from "next/server";
import { getSessionUser, getUserIdFromRequest, readRealGmailSubscriptions, syncRealGmailSubscriptions } from "@/lib/server/subcut-gmail";
import { sendTelegramDigest } from "@/lib/server/telegram";
import { protectMutation } from "@/lib/server/security";

export async function GET(request: Request) {
  const user = await getSessionUser(getUserIdFromRequest(request));
  if (!user) {
    return NextResponse.json({ ok: false, subscriptions: [] }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    subscriptions: await readRealGmailSubscriptions(user.id)
  });
}

export async function POST(request: Request) {
  const blocked = protectMutation(request, { key: "real-access-scan", limit: 6, windowMs: 60_000 });
  if (blocked) return blocked;

  const user = await getSessionUser(getUserIdFromRequest(request));
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized", subscriptions: [] }, { status: 401 });
  }

  try {
    const subscriptions = await syncRealGmailSubscriptions(user.id);
    await sendTelegramDigest(user.id).catch(() => null);
    return NextResponse.json({
      ok: true,
      subscriptions
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Real access scan failed",
        subscriptions: await readRealGmailSubscriptions(user.id)
      },
      { status: 400 }
    );
  }
}
