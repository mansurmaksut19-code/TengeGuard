import { NextResponse } from "next/server";
import { automaticConnectors } from "@/lib/server/subscription-connectors";
import { getSessionUserFromRequest, getUserIdFromRequest, readTokensFromRequest } from "@/lib/server/subcut-gmail";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  const user = await getSessionUserFromRequest(request, userId);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    connectors: await automaticConnectors(user, { gmailConnected: Boolean(await readTokensFromRequest(request, user.id)) })
  });
}
