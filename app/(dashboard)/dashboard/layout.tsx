import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const mode = cookieStore.get("tg_device_mode")?.value;
  if (mode !== "mobile" && mode !== "desktop") redirect("/");

  const userId = cookieStore.get("tg_user_id")?.value;
  if (!userId) redirect("/api/auth/google");

  return children;
}
