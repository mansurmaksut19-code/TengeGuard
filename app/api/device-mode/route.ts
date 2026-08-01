import { NextResponse } from "next/server";
import { secureCookieOptions } from "@/lib/server/security";

type DeviceMode = "mobile" | "desktop";
type BillingPlan = "free" | "pro_monthly" | "pro_yearly";

function normalizeMode(value: string | null): DeviceMode | null {
  if (value === "mobile" || value === "desktop") return value;
  return null;
}

function normalizePlan(value: string | null): BillingPlan | null {
  if (value === "free" || value === "pro_monthly" || value === "pro_yearly") return value;
  return null;
}

function readCookie(request: Request, name: string) {
  const value = request.headers.get("cookie")?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))?.[1];
  return value ? decodeURIComponent(value) : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = normalizeMode(url.searchParams.get("mode"));
  const plan = normalizePlan(url.searchParams.get("plan")) || "free";

  if (!mode) {
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (plan !== "free") {
    url.pathname = "/api/billing/checkout";
    url.search = `?plan=${plan}`;
    return NextResponse.redirect(url);
  }

  url.pathname = "/api/subcut/gmail/start";
  url.search = "";

  const response = NextResponse.redirect(url);
  response.cookies.set("tg_device_mode", mode, {
    ...secureCookieOptions(request, 60 * 60 * 24 * 365)
  });
  const currentPlan = readCookie(request, "tg_billing_plan");
  if (currentPlan !== "pro_monthly" && currentPlan !== "pro_yearly") {
    response.cookies.set("tg_billing_plan", plan, {
      ...secureCookieOptions(request, 60 * 60 * 24 * 365 * 2)
    });
  }
  if (plan === "free" && !readCookie(request, "tg_trial_started_at")) {
    const startedAt = new Date();
    const endsAt = new Date(startedAt);
    endsAt.setUTCDate(endsAt.getUTCDate() + 14);
    response.cookies.set("tg_trial_started_at", startedAt.toISOString(), {
      ...secureCookieOptions(request, 60 * 60 * 24 * 365 * 2)
    });
    response.cookies.set("tg_billing_ends_at", endsAt.toISOString(), {
      ...secureCookieOptions(request, 60 * 60 * 24 * 365 * 2)
    });
  }

  return response;
}
