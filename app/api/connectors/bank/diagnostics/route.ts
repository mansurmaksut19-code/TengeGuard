import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    providerConfigured: Boolean(process.env.TENGEGUARD_BANK_PROVIDER),
    hasProviderKey: Boolean(process.env.TENGEGUARD_BANK_PROVIDER_KEY || process.env.SALTEDGE_APP_ID),
    hasProviderSecret: Boolean(process.env.TENGEGUARD_BANK_PROVIDER_SECRET || process.env.SALTEDGE_SECRET),
    hasProviderUrl: Boolean(process.env.TENGEGUARD_BANK_PROVIDER_URL)
  });
}
