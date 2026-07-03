import type { Metadata } from "next";

import "./globals.css";
import { Providers } from "@/components/providers";
import { appContent } from "@/lib/content";

export const metadata: Metadata = {
  title: appContent.metadata.title,
  description: appContent.metadata.description
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
