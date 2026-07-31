import { NextResponse } from "next/server";
import { automaticConnectors } from "@/lib/server/subscription-connectors";
import { getSessionUserFromRequest, getUserIdFromRequest, readTokensFromRequest } from "@/lib/server/subcut-gmail";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  const user = await getSessionUserFromRequest(request, userId);

  return NextResponse.json({
    connectors: await automaticConnectors(user, {
      gmailConnected: Boolean(user && (await readTokensFromRequest(request, user.id))),
      request
    })
  }, {
    headers: {
      "Cache-Control": "no-store, max-age=0"
    }
  });
}
