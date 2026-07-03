import { NextResponse } from "next/server";
import { deleteRealGmailSubscription, getSessionUserFromRequest, getUserIdFromRequest } from "@/lib/server/subcut-gmail";
import { protectMutation } from "@/lib/server/security";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = protectMutation(request, { key: "subscription-delete", limit: 30, windowMs: 60_000 });
  if (blocked) return blocked;

  const { id } = await params;
  const userId = getUserIdFromRequest(request);
  const user = await getSessionUserFromRequest(request, userId);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await deleteRealGmailSubscription(user.id, id);
  return NextResponse.json({ ok: true });
}
