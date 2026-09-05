import type { NextConfig } from "next";

import { getSecurityHeaders } from "@/lib/security/headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  skipTrailingSlashRedirect: true,
  serverExternalPackages: ["pg"],
  output: process.env.CITED_DOCKER_BUILD === "true" ? "standalone" : undefined,
  async headers() {
    const securityHeaders = getSecurityHeaders({
      isProduction: process.env.NODE_ENV === "production",
      includeHsts: process.env.NODE_ENV === "production",
    });

    const crossOrigin = [
      {
        key: "Cross-Origin-Resource-Policy",
        value: "cross-origin",
      },
    ] as const;

    const sitemapHeaders = [
      {
        key: "Content-Type",
        value: "application/xml; charset=utf-8",
      },
      ...crossOrigin,
      {
        key: "Cache-Control",
        value: "no-store",
      },
    ] as const;

    return [
      {
        source:
          "/((?!sitemap\\.xml/?$|sitemap-index\\.xml/?$|sitemap/sitemap\\.xml/?$|robots\\.txt$|llms\\.txt$|llms-full\\.txt$|ai\\.txt$|blog/rss\\.xml$).*)",
        headers: securityHeaders,
      },
      {
        source: "/sitemap.xml",
        headers: [...sitemapHeaders],
      },
      {
        source: "/sitemap/sitemap.xml",
        headers: [...sitemapHeaders],
      },
      {
        source: "/sitemap-index.xml",
        headers: [...sitemapHeaders],
      },
      {
        source: "/robots.txt",
        headers: [
          {
            key: "Content-Type",
            value: "text/plain; charset=utf-8",
          },
          ...crossOrigin,
        ],
      },
      {
        source: "/llms.txt",
        headers: [...crossOrigin],
      },
      {
        source: "/llms-full.txt",
        headers: [...crossOrigin],
      },
      {
        source: "/ai.txt",
        headers: [...crossOrigin],
      },
      {
        source: "/blog/rss.xml",
        headers: [
          {
            key: "Content-Type",
            value: "application/rss+xml; charset=utf-8",
          },
          ...crossOrigin,
        ],
      },
    ];
  },
};

export default nextConfig;
