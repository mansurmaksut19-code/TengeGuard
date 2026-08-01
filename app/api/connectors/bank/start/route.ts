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
  const expired = requireActiveAccess(request);
  if (expired) return expired;

  try {
    const session = await createBankConnectSession(user, request);
    if (!session.connectUrl) {
      return NextResponse.json(
        { message: "Банковский провайдер ещё не настроен для этого окружения." },
        { status: 503 }
      );
    }

    const response = NextResponse.redirect(session.connectUrl);
    response.cookies.set(getBankSessionCookieName(), createEncryptedBankSession(user.id, session.state), {
      ...secureCookieOptions(request, 60 * 60 * 24 * 90)
    });
    return response;
  } catch (error) {
    const providerMessage = error instanceof Error ? error.message : "Unknown provider error";
    const waitingForAccess = /ActionNotAllowed|not enabled|pending|access/i.test(providerMessage);
    return NextResponse.json(
      {
        message: waitingForAccess
          ? "Salt Edge настроен, но аккаунту ещё не выдан Test или Live access. Откройте Salt Edge Dashboard и завершите запрос доступа."
          : `Salt Edge не открыл подключение банка: ${providerMessage}`
      },
      { status: 502 }
    );
  }
}
