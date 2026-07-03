import { NextResponse } from "next/server";
import { deleteRealGmailSubscription, getSessionUser, getUserIdFromRequest } from "@/lib/server/subcut-gmail";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = getUserIdFromRequest(request);
  const user = await getSessionUser(userId);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await deleteRealGmailSubscription(user.id, params.id);
  return NextResponse.json({ ok: true });
}
