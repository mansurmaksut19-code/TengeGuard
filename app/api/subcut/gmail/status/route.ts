import { NextResponse } from "next/server";
import { getGoogleOAuthConfig } from "@/lib/server/google-oauth-config";
import {
  buildGmailConnectUrl,
  getSessionUserFromRequest,
  getUserIdFromRequest,
  isGmailConfigured,
  readSyncReport,
  readTokensFromRequest
} from "@/lib/server/subcut-gmail";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const userId = getUserIdFromRequest(request);
  const configured = isGmailConfigured(origin);
  const tokens = await readTokensFromRequest(request, userId);
  const connected = Boolean(tokens);
  const googleConfig = getGoogleOAuthConfig(origin);
  const gisClientId = googleConfig.clientId || null;

  return NextResponse.json({
    ok: true,
    provider: "gmail",
    configured,
    identityConfigured: Boolean(gisClientId),
    gisClientId,
    connected,
    connectUrl: configured ? buildGmailConnectUrl(origin) : null,
    user: await getSessionUserFromRequest(request, userId),
    report: await readSyncReport(userId),
    scope: tokens?.scope || null
  });
}
