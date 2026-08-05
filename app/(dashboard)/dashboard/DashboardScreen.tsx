import { cookies } from "next/headers";
import App from "./App";

type View = "dashboard" | "subscriptions" | "evidence" | "access" | "history" | "ai" | "account";

export default async function DashboardScreen({ view = "dashboard" }: { view?: View }) {
  const cookieStore = await cookies();
  const mode = cookieStore.get("tg_device_mode")?.value === "mobile" ? "mobile" : "desktop";
  const planValue = cookieStore.get("tg_billing_plan")?.value;
  const plan = planValue === "pro_monthly" || planValue === "pro_yearly" || planValue === "free" ? planValue : "free";

  return (
    <App
      initialBillingEndsAt={cookieStore.get("tg_billing_ends_at")?.value || null}
      initialBillingPlan={plan}
      initialDeviceMode={mode}
      initialTrialStartedAt={cookieStore.get("tg_trial_started_at")?.value || null}
      initialView={view}
    />
  );
}
