import type { Subscription } from "@/lib/subcut-automation";

export type CancellationStatus = "auto_cancelled" | "needs_user_action" | "unsupported";

export type CancellationResult = {
  id: string;
  provider_name: string;
  status: CancellationStatus;
  cancellation_path: string;
  reason: string;
};

function hasVerifiedCancellationPath(subscription: Subscription) {
  return Boolean(subscription.cancellation_path) && !subscription.cancellation_path.includes("google.com/search");
}

function isPassiveFreePlan(subscription: Subscription) {
  return subscription.type === "free" && subscription.cost === 0 && !subscription.next_billing_date && !subscription.trial_ends_at;
}

export function prepareSubscriptionCancellation(subscription: Subscription): CancellationResult {
  if (subscription.status === "cancelled") {
    return {
      id: subscription.id,
      provider_name: subscription.provider_name,
      status: "unsupported",
      cancellation_path: subscription.cancellation_path,
      reason: "Already marked as cancelled in TengeGuard."
    };
  }

  if (isPassiveFreePlan(subscription)) {
    return {
      id: subscription.id,
      provider_name: subscription.provider_name,
      status: "unsupported",
      cancellation_path: subscription.cancellation_path,
      reason: "Free plans without an ending date usually do not have a paid subscription to cancel."
    };
  }

  if (!hasVerifiedCancellationPath(subscription)) {
    return {
      id: subscription.id,
      provider_name: subscription.provider_name,
      status: "unsupported",
      cancellation_path: subscription.cancellation_path,
      reason: "No verified cancellation channel was found from real account evidence."
    };
  }

  return {
    id: subscription.id,
    provider_name: subscription.provider_name,
    status: "needs_user_action",
    cancellation_path: subscription.cancellation_path,
    reason: "This provider requires the user's official account session, confirmation, or 2FA before cancellation."
  };
}
