import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json(
    { message: "Gmail scanning is disabled. Use the bank connection to sync paid subscriptions." },
    { status: 410 }
  );
}
