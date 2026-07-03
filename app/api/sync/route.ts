import { NextResponse } from "next/server";
import { getSessionUserFromRequest, getUserIdFromRequest, readTokensFromRequest, syncRealGmailSubscriptions } from "@/lib/server/subcut-gmail";
import { protectMutation } from "@/lib/server/security";

export async function POST(request: Request) {
  const blocked = protectMutation(request, { key: "sync", limit: 6, windowMs: 60_000 });
  if (blocked) return blocked;

  const userId = getUserIdFromRequest(request);
  const user = await getSessionUserFromRequest(request, userId);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await syncRealGmailSubscriptions(user.id, await readTokensFromRequest(request, user.id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Sync failed"
      },
      { status: 500 }
    );
  }
}
