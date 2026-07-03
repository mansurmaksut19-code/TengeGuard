import App from "../App";
import { cookies } from "next/headers";

export default async function AccessPage() {
  const cookieStore = await cookies();
  const mode = cookieStore.get("tg_device_mode")?.value === "mobile" ? "mobile" : "desktop";
  return <App initialView="access" initialDeviceMode={mode} />;
}
