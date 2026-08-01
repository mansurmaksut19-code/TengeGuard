import { NextResponse } from "next/server";

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

export function readAccessState(request: Request) {
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

export function requireActiveAccess(request: Request) {
  const access = readAccessState(request);
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
