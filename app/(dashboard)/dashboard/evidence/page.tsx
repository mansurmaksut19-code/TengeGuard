import App from "../App";
import { cookies } from "next/headers";

export default async function EvidencePage() {
  const cookieStore = await cookies();
  const mode = cookieStore.get("tg_device_mode")?.value === "mobile" ? "mobile" : "desktop";
  return <App initialView="evidence" initialDeviceMode={mode} />;
}
