import App from "../App";
import { cookies } from "next/headers";

export default function EvidencePage() {
  const mode = cookies().get("tg_device_mode")?.value === "mobile" ? "mobile" : "desktop";
  return <App initialView="evidence" initialDeviceMode={mode} />;
}
