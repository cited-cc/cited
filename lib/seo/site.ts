/**
 * Canonical site configuration for marketing SEO.
 * Never hardcode localhost into production metadata.
 */

import { getPublicDeploymentMode } from "@/lib/deployment/public-config";

export const SITE_NAME = "Cited";
export const SITE_DOMAIN = "cited.cc";

export const SITE_TAGLINE = "Know when AI cites you.";
export const SITE_DESCRIPTION =
  "Cited monitors the AI questions you choose and records when your website becomes part of the answer. Track citations, mentions, recommendations, and missed opportunities in one focused inbox.";

export const SITE_SUPPORTING_LINE =
  "A citation inbox for AI search.";

export const ORGANIZATION = {
  name: SITE_NAME,
  legalName: "Cited",
  url: "https://cited.cc",
  email: "hello@cited.cc",
  description: SITE_DESCRIPTION,
} as const;

/** Single public sitemap URL advertised by robots.txt and llms.txt. */
export const CANONICAL_SITEMAP_PATH = "/sitemap.xml";

export function canonicalSitemapUrl(): string {
  return `${ORGANIZATION.url}${CANONICAL_SITEMAP_PATH}`;
}

/**
 * Resolve the canonical site origin from environment.
 * Falls back safely for local development without poisoning production metadata.
 */
export function getSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname.endsWith(".vercel.app")
      ) {
        // Prefer the production domain for canonicals when not on the real host.
        if (process.env.VERCEL_ENV === "production") {
          return ORGANIZATION.url;
        }
        return url.origin;
      }
      return url.origin;
    } catch {
      // fall through
    }
  }

  if (process.env.VERCEL_ENV === "production") {
    return ORGANIZATION.url;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function absoluteUrl(path = "/"): string {
  const origin = getSiteOrigin();
  if (!path || path === "/") {
    return origin;
  }
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function isIndexableDeployment(): boolean {
  if (getPublicDeploymentMode() !== "cloud") {
    return false;
  }
  const vercelEnv = process.env.VERCEL_ENV;
  if (!vercelEnv) {
    // Local / unknown: do not claim production indexing.
    return process.env.NODE_ENV === "production";
  }
  return vercelEnv === "production";
}
