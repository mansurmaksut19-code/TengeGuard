import { NextResponse } from "next/server";
import { automaticConnectors, getBankSessionCookieName, syncBankSubscriptions } from "@/lib/server/subscription-connectors";
import {
  getSessionUserFromRequest,
  getUserIdFromRequest,
  readRealGmailSubscriptions,
  readTokensFromRequest,
  syncRealGmailSubscriptions
} from "@/lib/server/subcut-gmail";
import { protectMutation } from "@/lib/server/security";
import { secureCookieOptions } from "@/lib/server/security";
import { requireActiveAccess } from "@/lib/server/access-control";

export async function POST(request: Request) {
  const blocked = protectMutation(request, { key: "connectors-sync-all", limit: 6, windowMs: 60_000 });
  if (blocked) return blocked;

  const userId = getUserIdFromRequest(request);
  const user = await getSessionUserFromRequest(request, userId);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const expired = requireActiveAccess(request);
  if (expired) return expired;

  const tokens = await readTokensFromRequest(request, user.id);
  const connectors = await automaticConnectors(user, { gmailConnected: Boolean(tokens), request });
  const gmail = connectors.find((connector) => connector.id === "gmail");

  if (gmail?.status === "connected") {
    await syncRealGmailSubscriptions(user.id, tokens);
  }
  const bank = await syncBankSubscriptions(user, request);

  const response = NextResponse.json({
    ok: true,
    connectors,
    bank,
    subscriptions: await readRealGmailSubscriptions(user.id)
  });
  if ("bank_session" in bank && bank.bank_session) {
    response.cookies.set(getBankSessionCookieName(), bank.bank_session, {
      ...secureCookieOptions(request, 60 * 60 * 24 * 90)
    });
  }
  return response;
}
