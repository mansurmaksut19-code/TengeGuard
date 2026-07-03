import { NextResponse } from "next/server";
import { saveGoogleOAuthConfig, toPublicGoogleOAuthStatus } from "@/lib/server/google-oauth-config";
import { protectMutation, requireAdminSecret } from "@/lib/server/security";

type GoogleOAuthSetupRequest = {
  clientId?: string;
  clientSecret?: string;
  appUrl?: string;
  redirectUri?: string;
};

function isLocalSetupRequest(request: Request) {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return NextResponse.json({
    ok: true,
    ...toPublicGoogleOAuthStatus(origin)
  });
}

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const blocked = protectMutation(request, { key: "google-oauth-setup", limit: 5, windowMs: 60_000 });
  if (blocked) return blocked;

  const adminBlocked = isLocalSetupRequest(request) ? null : requireAdminSecret(request);
  if (adminBlocked) return adminBlocked;

  try {
    const body = (await request.json().catch(() => ({}))) as GoogleOAuthSetupRequest;
    const config = saveGoogleOAuthConfig(body, origin);
    return NextResponse.json({
      ok: true,
      ...toPublicGoogleOAuthStatus(origin),
      redirectUri: config.redirectUri
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to save Google OAuth setup"
      },
      { status: 400 }
    );
  }
}
