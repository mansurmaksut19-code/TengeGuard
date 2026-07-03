import App from "./App";
import { cookies } from "next/headers";

export default function DashboardPage() {
  const mode = cookies().get("tg_device_mode")?.value === "mobile" ? "mobile" : "desktop";
  return <App initialDeviceMode={mode} />;
}
