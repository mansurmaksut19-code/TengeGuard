import { NextResponse } from "next/server";
import { getSessionUser, getUserIdFromRequest } from "@/lib/server/subcut-gmail";

export async function GET(request: Request) {
  return NextResponse.json({
    user: await getSessionUser(getUserIdFromRequest(request))
  });
}
