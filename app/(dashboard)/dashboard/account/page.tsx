import { cookies } from "next/headers";
import App from "../App";

export default function AccountPage() {
  const mode = cookies().get("tg_device_mode")?.value === "mobile" ? "mobile" : "desktop";
  return <App initialView="account" initialDeviceMode={mode} />;
}
