import { NextResponse, type NextRequest } from "next/server";

type RateBucket = {
  count: number;
  resetAt: number;
};

const rateBuckets = new Map<string, RateBucket>();
const defaultWindowMs = 60_000;

export const secureCookieOptions = (request: Request, maxAge: number) => {
  const url = new URL(request.url);
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: url.protocol === "https:",
    path: "/",
    maxAge
  };
};

export function securityError(error: string, status = 403) {
  return NextResponse.json({ ok: false, error }, { status });
}

export function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function assertSameOrigin(request: Request) {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return null;

  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const allowedOrigin = url.origin;

  if (origin && origin !== allowedOrigin) {
    return securityError("Cross-origin request blocked");
  }

  if (!origin && referer) {
    try {
      if (new URL(referer).origin !== allowedOrigin) return securityError("Cross-origin request blocked");
    } catch {
      return securityError("Invalid request origin");
    }
  }

  return null;
}

export function rateLimit(request: Request, options?: { key?: string; limit?: number; windowMs?: number }) {
  const limit = options?.limit ?? 60;
  const windowMs = options?.windowMs ?? defaultWindowMs;
  const key = `${options?.key || "global"}:${getClientIp(request)}`;
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  bucket.count += 1;
  if (bucket.count <= limit) return null;

  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  return NextResponse.json(
    { ok: false, error: "Too many requests", retryAfter },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter)
      }
    }
  );
}

export function protectMutation(request: Request, options?: { key?: string; limit?: number; windowMs?: number }) {
  return assertSameOrigin(request) || rateLimit(request, options);
}

export function requireAdminSecret(request: Request) {
  const configuredSecret = process.env.TENGEGUARD_ADMIN_SECRET || process.env.TENGEGUARD_CRON_SECRET;
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(new URL(request.url).hostname);

  if (!configuredSecret) {
    return isLocal ? null : securityError("Admin endpoint is disabled until TENGEGUARD_ADMIN_SECRET is configured", 503);
  }

  const providedSecret = request.headers.get("x-tengeguard-admin-secret") || request.headers.get("x-tengeguard-cron-secret");
  if (providedSecret !== configuredSecret) return securityError("Unauthorized", 401);
  return null;
}

export function requireTelegramSecret(request: NextRequest | Request) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return securityError("Telegram webhook secret is not configured", 503);
  if (request.headers.get("x-telegram-bot-api-secret-token") !== expected) return securityError("Unauthorized", 401);
  return null;
}
