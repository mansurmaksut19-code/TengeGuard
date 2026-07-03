import { NextResponse } from "next/server";
import { getSessionUser, getUserIdFromRequest, syncRealGmailSubscriptions } from "@/lib/server/subcut-gmail";

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  const user = await getSessionUser(userId);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await syncRealGmailSubscriptions(user.id);
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
