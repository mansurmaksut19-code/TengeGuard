import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readTokens } from "@/lib/server/subcut-gmail";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies();
  const mode = cookieStore.get("tg_device_mode")?.value;
  if (mode !== "mobile" && mode !== "desktop") redirect("/");

  const userId = cookieStore.get("tg_user_id")?.value;
  const tokens = await readTokens(userId);
  if (!tokens) redirect("/auth/gmail");

  return children;
}
