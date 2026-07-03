import { NextResponse } from "next/server";
import { getSessionUserFromRequest, getUserIdFromRequest } from "@/lib/server/subcut-gmail";

export async function GET(request: Request) {
  return NextResponse.json({
    user: await getSessionUserFromRequest(request, getUserIdFromRequest(request))
  });
}
