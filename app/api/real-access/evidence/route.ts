import { NextResponse } from "next/server";
import { getSessionUser, getUserIdFromRequest, readRealGmailSubscriptions } from "@/lib/server/subcut-gmail";

export async function GET(request: Request) {
  const user = await getSessionUser(getUserIdFromRequest(request));
  if (!user) {
    return NextResponse.json({ ok: false, evidence: [] }, { status: 401 });
  }

  const subscriptions = await readRealGmailSubscriptions(user.id);

  return NextResponse.json({
    ok: true,
    evidence: subscriptions.flatMap((subscription) =>
      subscription.evidence.map((evidence) => ({
        subscription_id: subscription.id,
        provider_name: subscription.provider_name,
        type: subscription.type,
        confidence: subscription.confidence,
        ...evidence
      }))
    )
  });
}
