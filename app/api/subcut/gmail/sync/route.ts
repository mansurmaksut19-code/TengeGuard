import { NextResponse } from "next/server";

function disabled() {
  return NextResponse.json(
    { message: "Gmail scanning is disabled. Connect a bank to find paid subscriptions." },
    { status: 410 }
  );
}

export const GET = disabled;
export const POST = disabled;
