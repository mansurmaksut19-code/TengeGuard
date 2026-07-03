import { NextResponse } from "next/server";
import { getSessionUser, getUserIdFromRequest, saveImportedSubscriptions } from "@/lib/server/subcut-gmail";
import { parseSubscriptionImport } from "@/lib/server/subscription-import";

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  const user = await getSessionUser(userId);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const source = String(form.get("source") || "");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "File is required" }, { status: 400 });
    }

    const text = await file.text();
    const result = parseSubscriptionImport(user.id, file.name, text, source);
    const subscriptions = await saveImportedSubscriptions(user.id, result.subscriptions);

    return NextResponse.json({
      ok: true,
      source: result.source,
      transactions_imported: result.imported,
      subscriptions_imported: result.subscriptions.length,
      subscriptions
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Import failed"
      },
      { status: 400 }
    );
  }
}
