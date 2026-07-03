import { cookies } from "next/headers";
import App from "../App";

export default function AiPage() {
  const mode = cookies().get("tg_device_mode")?.value === "mobile" ? "mobile" : "desktop";
  return <App initialView="ai" initialDeviceMode={mode} />;
}
