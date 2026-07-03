import { NextResponse } from "next/server";
import { automaticConnectors, syncBankSubscriptions } from "@/lib/server/subscription-connectors";
import { getSessionUser, getUserIdFromRequest, readRealGmailSubscriptions, syncRealGmailSubscriptions } from "@/lib/server/subcut-gmail";
import { protectMutation } from "@/lib/server/security";

export async function POST(request: Request) {
  const blocked = protectMutation(request, { key: "connectors-sync-all", limit: 6, windowMs: 60_000 });
  if (blocked) return blocked;

  const userId = getUserIdFromRequest(request);
  const user = await getSessionUser(userId);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const connectors = await automaticConnectors(user);
  const gmail = connectors.find((connector) => connector.id === "gmail");

  if (gmail?.status === "connected") {
    await syncRealGmailSubscriptions(user.id);
  }
  const bank = await syncBankSubscriptions(user);

  return NextResponse.json({
    ok: true,
    connectors,
    bank,
    subscriptions: await readRealGmailSubscriptions(user.id)
  });
}
