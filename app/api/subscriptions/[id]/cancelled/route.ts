import { NextResponse } from "next/server";
import { getSessionUserFromRequest, getUserIdFromRequest, markRealGmailSubscriptionCancelled } from "@/lib/server/subcut-gmail";
import { protectMutation } from "@/lib/server/security";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = protectMutation(request, { key: "subscription-cancelled", limit: 30, windowMs: 60_000 });
  if (blocked) return blocked;

  const { id } = await params;
  const userId = getUserIdFromRequest(request);
  const user = await getSessionUserFromRequest(request, userId);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const subscription = await markRealGmailSubscriptionCancelled(user.id, id);
  if (!subscription) {
    return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, subscription });
}
