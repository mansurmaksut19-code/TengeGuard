import { NextResponse } from "next/server";
import { setTrialDaysRemaining } from "@/lib/server/payments";
import { requireAdminSecret } from "@/lib/server/security";
import { userIdFromEmail } from "@/lib/server/subcut-gmail";

type TrialAdjustmentRequest = {
  days?: number;
  email?: string;
  user_id?: string;
};

export async function POST(request: Request) {
  const blocked = requireAdminSecret(request);
  if (blocked) return blocked;

  const body = (await request.json().catch(() => ({}))) as TrialAdjustmentRequest;
  const userId = body.user_id || (body.email ? userIdFromEmail(body.email) : "");
  const days = Number(body.days);

  if (!userId) return NextResponse.json({ ok: false, error: "email or user_id is required" }, { status: 400 });
  if (!Number.isFinite(days)) return NextResponse.json({ ok: false, error: "days is required" }, { status: 400 });

  const billing = await setTrialDaysRemaining(userId, days);
  return NextResponse.json({ ok: true, billing });
}
