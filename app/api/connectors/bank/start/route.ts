import { NextResponse } from "next/server";
import { createBankConnectUrl } from "@/lib/server/subscription-connectors";
import { getSessionUserFromRequest, getUserIdFromRequest } from "@/lib/server/subcut-gmail";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  const user = await getSessionUserFromRequest(request, userId);
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const url = await createBankConnectUrl(user);
  if (!url) {
    return NextResponse.json(
      {
        message:
          "Bank auto-connect is not configured. Set Salt Edge App-id and Secret in TENGEGUARD_BANK_PROVIDER_KEY / TENGEGUARD_BANK_PROVIDER_SECRET."
      },
      { status: 501 }
    );
  }

  return NextResponse.redirect(url);
}
