import { NextResponse } from "next/server";
import {
  createBankConnectSession,
  createEncryptedBankSession,
  getBankSessionCookieName
} from "@/lib/server/subscription-connectors";
import { secureCookieOptions } from "@/lib/server/security";
import { requireActiveAccess } from "@/lib/server/access-control";
import { getSessionUserFromRequest, getUserIdFromRequest } from "@/lib/server/subcut-gmail";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  const user = await getSessionUserFromRequest(request, userId);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const expired = await requireActiveAccess(request, user.id);
  if (expired) return expired;

  try {
    const provider = new URL(request.url).searchParams.get("provider") || undefined;
    const session = await createBankConnectSession(user, request, { providerQuery: provider });
    if (!session.connectUrl) {
      const destination = new URL("/dashboard/account", request.url);
      destination.searchParams.set("bank_error", "bank_pending");
      return NextResponse.redirect(destination);
    }

    const response = NextResponse.redirect(session.connectUrl);
    response.cookies.set(getBankSessionCookieName(), createEncryptedBankSession(user.id, session.state), {
      ...secureCookieOptions(request, 60 * 60 * 24 * 90)
    });
    return response;
  } catch (error) {
    const providerMessage = error instanceof Error ? error.message : "Unknown provider error";
    const waitingForAccess = /ActionNotAllowed|not enabled|pending|access/i.test(providerMessage);
    const kaspiUnavailable = /Kaspi|connection is not available/i.test(providerMessage);
    const destination = new URL("/dashboard/account", request.url);
    destination.searchParams.set("bank_error", kaspiUnavailable || waitingForAccess ? "bank_pending" : "provider_error");
    return NextResponse.redirect(destination);
  }
}
