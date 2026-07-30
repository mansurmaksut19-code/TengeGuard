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

  url.pathname = "/api/auth/google";
  url.search = "";

  const response = NextResponse.redirect(url);
  response.cookies.set("tg_device_mode", mode, {
    ...secureCookieOptions(request, 60 * 60 * 24 * 365)
  });
  response.cookies.set("tg_billing_plan", plan, {
    ...secureCookieOptions(request, 60 * 60 * 24 * 365)
  });
  if (plan === "free") {
    response.cookies.set("tg_trial_started_at", new Date().toISOString(), {
      ...secureCookieOptions(request, 60 * 60 * 24 * 30)
    });
  }

  return response;
}
