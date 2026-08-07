import type { Metadata } from "next";
import { Caveat, Onest } from "next/font/google";

import "./globals.css";
import { Providers } from "@/components/providers";

const interfaceFont = Onest({
  subsets: ["cyrillic", "latin"],
  display: "swap",
  variable: "--font-interface",
  fallback: ["Arial", "sans-serif"]
});

const displayFont = Caveat({
  subsets: ["cyrillic", "latin"],
  display: "swap",
  variable: "--font-display",
  fallback: ["Segoe Print", "Comic Sans MS", "cursive"]
});

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
      <body className={`${interfaceFont.variable} ${displayFont.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
