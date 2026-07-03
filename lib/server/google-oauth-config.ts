import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type StoredGoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  appUrl?: string;
  redirectUri?: string;
  updatedAt: string;
};

export type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  appUrl: string;
  redirectUri: string;
  configured: boolean;
  source: "environment" | "setup" | "missing";
};

type SaveGoogleOAuthConfigInput = {
  clientId?: string;
  clientSecret?: string;
  appUrl?: string;
  redirectUri?: string;
};

const configPath = path.join(process.cwd(), ".tengeguard", "config", "google-oauth.json");

function trim(value?: string) {
  return value?.trim() || "";
}

function readStoredGoogleOAuthConfig() {
  try {
    return JSON.parse(readFileSync(configPath, "utf8")) as StoredGoogleOAuthConfig;
  } catch {
    return null;
  }
}

function defaultAppUrl(origin?: string) {
  return trim(origin) || trim(process.env.NEXT_PUBLIC_APP_URL) || "http://localhost:3001";
}

export function getGoogleOAuthConfig(origin?: string): GoogleOAuthConfig {
  const stored = readStoredGoogleOAuthConfig();
  const envClientId = trim(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) || trim(process.env.GOOGLE_CLIENT_ID);
  const envClientSecret = trim(process.env.GOOGLE_CLIENT_SECRET);
  const storedClientId = trim(stored?.clientId);
  const storedClientSecret = trim(stored?.clientSecret);
  const clientId = envClientId || storedClientId;
  const clientSecret = envClientSecret || storedClientSecret;
  const appUrl = defaultAppUrl(origin || stored?.appUrl);
  const redirectUri =
    trim(process.env.GOOGLE_REDIRECT_URI) ||
    trim(stored?.redirectUri) ||
    `${appUrl.replace(/\/$/, "")}/api/subcut/gmail/callback`;
  const configured = Boolean(clientId && clientSecret && redirectUri);

  return {
    clientId,
    clientSecret,
    appUrl,
    redirectUri,
    configured,
    source: envClientId || envClientSecret ? "environment" : storedClientId || storedClientSecret ? "setup" : "missing"
  };
}

export function saveGoogleOAuthConfig(input: SaveGoogleOAuthConfigInput, origin?: string) {
  const clientId = trim(input.clientId);
  const clientSecret = trim(input.clientSecret);
  const appUrl = trim(input.appUrl) || defaultAppUrl(origin);
  const redirectUri = trim(input.redirectUri) || `${appUrl.replace(/\/$/, "")}/api/subcut/gmail/callback`;

  if (!clientId.endsWith(".apps.googleusercontent.com")) {
    throw new Error("Google OAuth Client ID должен заканчиваться на .apps.googleusercontent.com");
  }

  if (!clientSecret) {
    throw new Error("Google OAuth Client Secret обязателен");
  }

  mkdirSync(path.dirname(configPath), { recursive: true });
  writeFileSync(
    configPath,
    JSON.stringify(
      {
        clientId,
        clientSecret,
        appUrl,
        redirectUri,
        updatedAt: new Date().toISOString()
      } satisfies StoredGoogleOAuthConfig,
      null,
      2
    ),
    "utf8"
  );

  return getGoogleOAuthConfig(origin);
}

export function toPublicGoogleOAuthStatus(origin?: string) {
  const config = getGoogleOAuthConfig(origin);
  return {
    configured: config.configured,
    identityConfigured: Boolean(config.clientId),
    gmailConfigured: Boolean(config.clientId && config.clientSecret),
    clientId: config.clientId,
    appUrl: config.appUrl,
    redirectUri: config.redirectUri,
    source: config.source
  };
}
