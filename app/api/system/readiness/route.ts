import { NextResponse } from "next/server";
import { isPersistentStoreConfigured } from "@/lib/server/data-store";
import { readFreedomPayConfig } from "@/lib/server/payments";
import { isGmailConfigured } from "@/lib/server/subcut-gmail";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return NextResponse.json(
    {
      ok: true,
      gmailConfigured: isGmailConfigured(origin),
      paymentConfigured: Boolean(readFreedomPayConfig()),
      persistentStoreConfigured: isPersistentStoreConfigured()
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
