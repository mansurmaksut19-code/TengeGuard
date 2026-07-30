import type { Metadata } from "next";

import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "TengeGuard",
  description:
    "TengeGuard helps users find paid subscriptions, free plans, trial periods, renewal dates, and billing evidence from user-approved sources such as Google Sign-In and optional Gmail read-only access.",
  applicationName: "TengeGuard",
  openGraph: {
    title: "TengeGuard",
    description:
      "Subscription discovery and reminder dashboard for paid, free, and trial subscriptions.",
    siteName: "TengeGuard",
    url: "https://www.tengeguard.online"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
