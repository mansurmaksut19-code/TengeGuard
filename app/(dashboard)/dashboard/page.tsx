import App from "./App";
import { cookies } from "next/headers";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const mode = cookieStore.get("tg_device_mode")?.value === "mobile" ? "mobile" : "desktop";
  const billingPlanValue = cookieStore.get("tg_billing_plan")?.value;
  const billingPlan =
    billingPlanValue === "pro_monthly" || billingPlanValue === "pro_yearly" || billingPlanValue === "free"
      ? billingPlanValue
      : "free";
  const trialStartedAt = cookieStore.get("tg_trial_started_at")?.value || null;
  return <App initialBillingPlan={billingPlan} initialDeviceMode={mode} initialTrialStartedAt={trialStartedAt} />;
}
