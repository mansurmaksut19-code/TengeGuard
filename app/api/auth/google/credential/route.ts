import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { getGoogleOAuthConfig } from "@/lib/server/google-oauth-config";
import { readTokens, saveSessionUser, userIdFromEmail } from "@/lib/server/subcut-gmail";
import { protectMutation, secureCookieOptions } from "@/lib/server/security";

type GoogleCredentialRequest = {
  credential?: string;
};

function getGoogleIdentityClientId() {
  return getGoogleOAuthConfig().clientId;
}

export async function POST(request: Request) {
  try {
    const blocked = protectMutation(request, { key: "google-credential", limit: 20, windowMs: 60_000 });
    if (blocked) return blocked;

    const clientId = getGoogleIdentityClientId();
    if (!clientId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Google sign-in is temporarily unavailable"
        },
        { status: 500 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as GoogleCredentialRequest;
    if (!body.credential) {
      return NextResponse.json(
        {
          ok: false,
          error: "Google credential was not provided"
        },
        { status: 400 }
      );
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: body.credential,
      audience: clientId
    });

    const payload = ticket.getPayload();
    if (!payload?.email || !payload.email_verified) {
      return NextResponse.json(
        {
          ok: false,
          error: "Google account email is missing or not verified"
        },
        { status: 401 }
      );
    }

    const userId = userIdFromEmail(payload.email);
    const user = {
      id: userId,
      email: payload.email,
      name: payload.name || payload.email,
      avatar_url: payload.picture
    };

    await saveSessionUser(user);
    const tokens = await readTokens(userId);

    const response = NextResponse.json({
      ok: true,
      status: "success",
      user,
      gmailConnected: Boolean(tokens)
    });

    response.cookies.set("tg_user_id", userId, {
      ...secureCookieOptions(request, 60 * 60 * 24 * 30)
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Google credential verification error";
    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      { status: 401 }
    );
  }
}
