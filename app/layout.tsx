import type { Metadata } from "next";

import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "TengeGuard",
  description:
    "TengeGuard finds paid subscriptions from authorized bank transaction history, forecasts recurring charges, and sends reminders before the next payment.",
  applicationName: "TengeGuard",
  icons: {
    icon: "/tengeguard-mark.jpg",
    apple: "/tengeguard-mark.jpg"
  },
  openGraph: {
    title: "TengeGuard",
    description:
      "Paid subscription discovery and recurring-charge reminder dashboard.",
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
    <html lang="ru" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
