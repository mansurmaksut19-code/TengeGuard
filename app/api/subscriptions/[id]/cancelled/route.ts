import { NextResponse } from "next/server";
import { getSessionUser, getUserIdFromRequest, markRealGmailSubscriptionCancelled } from "@/lib/server/subcut-gmail";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = getUserIdFromRequest(request);
  const user = await getSessionUser(userId);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const subscription = await markRealGmailSubscriptionCancelled(user.id, params.id);
  if (!subscription) {
    return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, subscription });
}
