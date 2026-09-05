import type { MetadataRoute } from "next";

import { canonicalSitemapUrl, isIndexableDeployment } from "@/lib/seo/site";

/** Always generate at request time for accurate crawler directives. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function robots(): MetadataRoute.Robots {
  if (!isIndexableDeployment()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/app/",
          "/api/",
          "/api/export/",
          "/scan/result/",
          "/subprocessors",
          "/launch/screenshots",
          "/onboarding",
          "/unsubscribe/",
          "/preferences/",
          "/sign-in",
          "/sign-up",
          "/forgot-password",
          "/internal/",
        ],
      },
    ],
    sitemap: canonicalSitemapUrl(),
  };
}
