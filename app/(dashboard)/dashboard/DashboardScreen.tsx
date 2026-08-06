import { cookies } from "next/headers";
import { readBillingState } from "@/lib/server/payments";
import App from "./App";

type View = "dashboard" | "subscriptions" | "ai" | "account";

export default async function DashboardScreen({ view = "dashboard" }: { view?: View }) {
  const cookieStore = await cookies();
  const mode = cookieStore.get("tg_device_mode")?.value === "mobile" ? "mobile" : "desktop";
  const userId = cookieStore.get("tg_user_id")?.value;
  const billing = await readBillingState(userId);
  const planValue = billing?.status === "active" ? billing.plan : cookieStore.get("tg_billing_plan")?.value;
  const plan = planValue === "pro_monthly" || planValue === "pro_yearly" || planValue === "free" ? planValue : "free";

  return (
    <App
      initialBillingEndsAt={billing?.status === "active" ? billing.ends_at : cookieStore.get("tg_billing_ends_at")?.value || null}
      initialBillingPlan={plan}
      initialDeviceMode={mode}
      initialTrialStartedAt={cookieStore.get("tg_trial_started_at")?.value || null}
      initialView={view}
    />
  );
}
