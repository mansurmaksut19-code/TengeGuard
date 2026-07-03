import { NextResponse } from "next/server";
import { saveGoogleOAuthConfig, toPublicGoogleOAuthStatus } from "@/lib/server/google-oauth-config";

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

  if (!isLocalSetupRequest(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Setup is available only from the local founder machine"
      },
      { status: 403 }
    );
  }

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
