import { NextResponse } from "next/server";
import { prepareSubscriptionCancellation } from "@/lib/server/subscription-cancel";
import { getSessionUser, getUserIdFromRequest, readRealGmailSubscriptions } from "@/lib/server/subcut-gmail";
import { protectMutation } from "@/lib/server/security";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = protectMutation(request, { key: "subscription-cancel", limit: 30, windowMs: 60_000 });
  if (blocked) return blocked;

  const { id } = await params;
  const userId = getUserIdFromRequest(request);
  const user = await getSessionUser(userId);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const subscriptions = await readRealGmailSubscriptions(user.id);
  const subscription = subscriptions.find((item) => item.id === id);
  if (!subscription) {
    return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    result: prepareSubscriptionCancellation(subscription)
  });
}
