import { cookies } from "next/headers";
import App from "../App";

export default async function AiPage() {
  const cookieStore = await cookies();
  const mode = cookieStore.get("tg_device_mode")?.value === "mobile" ? "mobile" : "desktop";
  return <App initialView="ai" initialDeviceMode={mode} />;
}
