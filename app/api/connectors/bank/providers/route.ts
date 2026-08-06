import { NextResponse } from "next/server";
import { getKaspiProvider } from "@/lib/server/subscription-connectors";

export async function GET() {
  try {
    const provider = await getKaspiProvider();
    return NextResponse.json(
      {
        kaspi: provider
          ? { available: true, code: provider.code, mode: provider.mode, name: provider.name, status: provider.status }
          : { available: false }
      },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch (error) {
    return NextResponse.json(
      { kaspi: { available: false }, message: error instanceof Error ? error.message : "Provider lookup failed" },
      { status: 502 }
    );
  }
}
