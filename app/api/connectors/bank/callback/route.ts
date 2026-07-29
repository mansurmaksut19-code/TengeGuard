import { NextResponse } from "next/server";
import {
  createEncryptedBankSession,
  getBankSessionCookieName,
  saveBankConnection
} from "@/lib/server/subscription-connectors";
import { protectMutation, secureCookieOptions } from "@/lib/server/security";
import { getSessionUserFromRequest, getUserIdFromRequest } from "@/lib/server/subcut-gmail";

function extractConnectionId(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  const data = (record.data && typeof record.data === "object" ? record.data : record) as Record<string, unknown>;
  return String(data.connection_id || data.id || data.connectionId || "");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = getUserIdFromRequest(request);
  const user = await getSessionUserFromRequest(request, userId);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const connectionId = url.searchParams.get("connection_id") || url.searchParams.get("id") || "";
  const state = await saveBankConnection(user.id, connectionId, request);

  const response = NextResponse.redirect(new URL("/dashboard/subscriptions", request.url));
  response.cookies.set(getBankSessionCookieName(), createEncryptedBankSession(user.id, state), {
    ...secureCookieOptions(request, 60 * 60 * 24 * 90)
  });
  return response;
}

export async function POST(request: Request) {
  const blocked = protectMutation(request, { key: "bank-callback", limit: 20, windowMs: 60_000 });
  if (blocked) return blocked;

  const userId = getUserIdFromRequest(request);
  const user = await getSessionUserFromRequest(request, userId);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const connectionId = extractConnectionId(body);
  if (connectionId) await saveBankConnection(user.id, connectionId);

  return NextResponse.json({ ok: true });
}
