import { NextResponse } from "next/server";
import { readBillingState } from "@/lib/server/payments";

const trialDurationMs = 14 * 24 * 60 * 60 * 1000;

function readCookie(request: Request, name: string) {
  const value = request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))?.[1];
  return value ? decodeURIComponent(value) : null;
}

function timestamp(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

export async function readAccessState(request: Request, userId?: string) {
  const stored = await readBillingState(userId);
  if (stored?.status === "active" || stored?.status === "trial") {
    return {
      active: new Date(stored.ends_at).getTime() > Date.now(),
      endsAt: stored.ends_at,
      plan: stored.plan
    };
  }
  if (stored?.status === "expired") {
    return {
      active: false,
      endsAt: stored.ends_at,
      plan: stored.plan
    };
  }

  const plan = readCookie(request, "tg_billing_plan") || "free";
  const explicitEnd = timestamp(readCookie(request, "tg_billing_ends_at"));
  const trialStart = timestamp(readCookie(request, "tg_trial_started_at"));
  const endsAt = explicitEnd || (plan === "free" && trialStart ? trialStart + trialDurationMs : null);

  return {
    active: Boolean(endsAt && endsAt > Date.now()),
    endsAt: endsAt ? new Date(endsAt).toISOString() : null,
    plan
  };
}

export async function requireActiveAccess(request: Request, userId?: string) {
  const access = await readAccessState(request, userId);
  if (access.active) return null;
  return NextResponse.json(
    {
      ok: false,
      code: "access_expired",
      error: access.plan === "free" ? "Free Trial закончился. Выберите Pro, чтобы продолжить." : "Подписка Pro закончилась. Продлите доступ."
    },
    { status: 402 }
  );
}
