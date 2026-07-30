import { NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/server/security";

export async function GET(request: Request) {
  const blocked = requireAdminSecret(request);
  if (blocked) return blocked;

  return NextResponse.json({
    ok: true,
    provider: process.env.TENGEGUARD_BANK_PROVIDER || null,
    hasProviderKey: Boolean(process.env.TENGEGUARD_BANK_PROVIDER_KEY || process.env.SALTEDGE_APP_ID),
    hasProviderSecret: Boolean(process.env.TENGEGUARD_BANK_PROVIDER_SECRET || process.env.SALTEDGE_SECRET),
    providerUrl: process.env.TENGEGUARD_BANK_PROVIDER_URL || "https://www.saltedge.com/api/v6"
  });
}
