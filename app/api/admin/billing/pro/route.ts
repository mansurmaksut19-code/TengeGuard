import { NextResponse } from "next/server";
import { activateLifetimePro } from "@/lib/server/payments";
import { requireAdminSecret } from "@/lib/server/security";
import { userIdFromEmail } from "@/lib/server/subcut-gmail";

type ProActivationRequest = {
  email?: string;
  user_id?: string;
};

export async function POST(request: Request) {
  const blocked = requireAdminSecret(request);
  if (blocked) return blocked;

  const body = (await request.json().catch(() => ({}))) as ProActivationRequest;
  const userId = body.user_id || (body.email ? userIdFromEmail(body.email) : "");
  if (!userId) return NextResponse.json({ ok: false, error: "email or user_id is required" }, { status: 400 });

  const billing = await activateLifetimePro(userId);
  return NextResponse.json({ ok: true, billing });
}
