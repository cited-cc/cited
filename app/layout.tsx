import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, Onest } from "next/font/google";
import Script from "next/script";

import { CITED_THEME_BOOT_SCRIPT } from "@/lib/theme/theme";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "@/lib/seo/site";

import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  adjustFontFallback: true,
  preload: true,
});

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  adjustFontFallback: true,
  preload: true,
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  adjustFontFallback: true,
  // Mono is secondary UI chrome; keep it off the LCP critical path.
  preload: false,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fbf7f0",
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl("/")),
  title: {
    default: SITE_NAME,
    template: "%s · Cited",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    types: {
      "text/plain": absoluteUrl("/llms.txt"),
      "application/rss+xml": absoluteUrl("/blog/rss.xml"),
    },
  },
  icons: {
    icon: [{ url: "/cited-mark.svg", type: "image/svg+xml" }],
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION ||
  process.env.BING_SITE_VERIFICATION
    ? {
        verification: {
          ...(process.env.GOOGLE_SITE_VERIFICATION
            ? { google: process.env.GOOGLE_SITE_VERIFICATION }
            : {}),
          ...(process.env.BING_SITE_VERIFICATION
            ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } }
            : {}),
        },
      }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${bricolage.variable} ${onest.variable} ${ibmPlexMono.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="flex min-h-dvh flex-col overflow-x-clip bg-cited-canvas text-cited-ink">
        <Script
          id="cited-theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: CITED_THEME_BOOT_SCRIPT }}
        />
        {children}
      </body>
    </html>
  );
}
