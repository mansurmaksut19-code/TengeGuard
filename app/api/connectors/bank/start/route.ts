import { NextResponse } from "next/server";
import {
  createBankConnectSession,
  createEncryptedBankSession,
  getBankSessionCookieName
} from "@/lib/server/subscription-connectors";
import { secureCookieOptions } from "@/lib/server/security";
import { getSessionUserFromRequest, getUserIdFromRequest } from "@/lib/server/subcut-gmail";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  const user = await getSessionUserFromRequest(request, userId);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const session = await createBankConnectSession(user, request);
  if (!session.connectUrl) {
    return NextResponse.json(
      {
        message:
          "Salt Edge keys are missing in this deployment. Add TENGEGUARD_BANK_PROVIDER_KEY and TENGEGUARD_BANK_PROVIDER_SECRET in Vercel Environment Variables, then redeploy."
      },
      { status: 501 }
    );
  }

  const response = NextResponse.redirect(session.connectUrl);
  response.cookies.set(getBankSessionCookieName(), createEncryptedBankSession(user.id, session.state), {
    ...secureCookieOptions(request, 60 * 60 * 24 * 90)
  });
  return response;
}
