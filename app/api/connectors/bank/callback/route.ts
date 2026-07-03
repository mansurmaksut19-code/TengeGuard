import { NextResponse } from "next/server";
import { saveBankConnection } from "@/lib/server/subscription-connectors";
import { getSessionUser, getUserIdFromRequest } from "@/lib/server/subcut-gmail";
import { protectMutation } from "@/lib/server/security";

function extractConnectionId(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  const data = (record.data && typeof record.data === "object" ? record.data : record) as Record<string, unknown>;
  return String(data.connection_id || data.id || data.connectionId || "");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = getUserIdFromRequest(request);
  const user = await getSessionUser(userId);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const connectionId = url.searchParams.get("connection_id") || url.searchParams.get("id") || "";
  if (connectionId) await saveBankConnection(user.id, connectionId);

  return NextResponse.redirect(new URL("/dashboard/subscriptions", request.url));
}

export async function POST(request: Request) {
  const blocked = protectMutation(request, { key: "bank-callback", limit: 20, windowMs: 60_000 });
  if (blocked) return blocked;

  const userId = getUserIdFromRequest(request);
  const user = await getSessionUser(userId);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const connectionId = extractConnectionId(body);
  if (connectionId) await saveBankConnection(user.id, connectionId);

  return NextResponse.json({ ok: true });
}
