import { NextResponse } from "next/server";
import { getGoogleOAuthConfig } from "@/lib/server/google-oauth-config";
import {
  buildGoogleSignInUrl,
  getSessionUserFromRequest,
  getUserIdFromRequest,
  isGmailConfigured,
  readSyncReport
} from "@/lib/server/subcut-gmail";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const userId = getUserIdFromRequest(request);
  const configured = isGmailConfigured(origin);
  const user = await getSessionUserFromRequest(request, userId);
  const connected = Boolean(user);
  const googleConfig = getGoogleOAuthConfig(origin);
  const gisClientId = googleConfig.clientId || null;

  return NextResponse.json({
    ok: true,
    provider: "google",
    configured,
    identityConfigured: Boolean(gisClientId),
    gisClientId,
    connected,
    connectUrl: configured ? buildGoogleSignInUrl(origin) : null,
    user,
    report: await readSyncReport(userId),
    scope: "openid email profile"
  });
}
