import { NextResponse } from "next/server";
import { prepareSubscriptionCancellation } from "@/lib/server/subscription-cancel";
import { getSessionUser, getUserIdFromRequest, readRealGmailSubscriptions } from "@/lib/server/subcut-gmail";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = getUserIdFromRequest(request);
  const user = await getSessionUser(userId);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const subscriptions = await readRealGmailSubscriptions(user.id);
  const subscription = subscriptions.find((item) => item.id === params.id);
  if (!subscription) {
    return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    result: prepareSubscriptionCancellation(subscription)
  });
}
