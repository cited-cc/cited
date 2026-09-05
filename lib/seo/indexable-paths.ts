import { getBlogIndexablePaths, getAllBlogArticles } from "@/lib/content/blog";
import {
  DOCS_INDEX,
  REQUIRED_DOCS_SLUGS,
  getAllDocsArticles,
  getDocsArticle,
  getDocsPath,
} from "@/lib/content/docs";

/** Core marketing pages that are always indexable in production. */
export const CORE_MARKETING_PATHS = [
  "/",
  "/demo",
  "/pricing",
  "/scan",
  "/how-it-works",
] as const;

/** Legal and trust pages. Thin /status is noindex and omitted. */
export const LEGAL_TRUST_PATHS = [
  "/security",
  "/privacy",
  "/terms",
  "/cookies",
  "/acceptable-use",
  "/refund-policy",
  "/dpa",
  "/contact",
] as const;

/**
 * Per-path lastmod for marketing/legal URLs.
 * Do not inherit the frozen docs/blog LAST_UPDATED date.
 */
const MARKETING_PATH_LASTMOD: Record<string, string> = {
  "/": "2026-07-31",
  "/demo": "2026-07-09",
  "/pricing": "2026-08-18",
  "/scan": "2026-07-09",
  "/how-it-works": "2026-08-18",
  "/security": "2026-07-09",
  "/privacy": "2026-07-09",
  "/terms": "2026-07-09",
  "/cookies": "2026-07-09",
  "/acceptable-use": "2026-07-09",
  "/refund-policy": "2026-07-09",
  "/dpa": "2026-07-09",
  "/contact": "2026-07-30",
};

export function getDocsIndexablePaths(): string[] {
  return ["/docs", ...REQUIRED_DOCS_SLUGS.map((slug) => getDocsPath(slug))];
}

export function buildPublicIndexablePaths(): string[] {
  return [
    ...CORE_MARKETING_PATHS,
    ...getDocsIndexablePaths(),
    ...getBlogIndexablePaths(),
    ...LEGAL_TRUST_PATHS,
  ];
}

function dateFromDay(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function getPathLastModified(path: string): Date {
  const blogMatch = path.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    const article = getAllBlogArticles().find(
      (item) => item.slug === blogMatch[1],
    );
    if (article) {
      return dateFromDay(article.updatedAt);
    }
  }

  if (path === "/blog") {
    const blogDates = getAllBlogArticles().map((article) => article.updatedAt);
    const latest = [...blogDates].sort().at(-1);
    if (latest) {
      return dateFromDay(latest);
    }
  }

  if (path === "/docs") {
    return dateFromDay(DOCS_INDEX.lastUpdated);
  }

  const docsMatch = path.match(/^\/docs\/([^/]+)$/);
  if (docsMatch) {
    const article = getDocsArticle(docsMatch[1]);
    if (article) {
      return dateFromDay(article.lastUpdated);
    }
  }

  const marketingDate = MARKETING_PATH_LASTMOD[path];
  if (marketingDate) {
    return dateFromDay(marketingDate);
  }

  return new Date();
}

export function getLatestContentUpdatedDate(): string {
  const docsDates = getAllDocsArticles().map((article) => article.lastUpdated);
  const blogDates = getAllBlogArticles().map((article) => article.updatedAt);
  return [...docsDates, ...blogDates, DOCS_INDEX.lastUpdated].sort().at(-1) ?? "";
}

/** Public indexable marketing paths derived from content registries. */
let publicIndexablePathsCache: string[] | undefined;

export function getPublicIndexablePaths(): readonly string[] {
  if (!publicIndexablePathsCache) {
    publicIndexablePathsCache = buildPublicIndexablePaths();
  }
  return publicIndexablePathsCache;
}

export type PublicIndexablePath = ReturnType<
  typeof getPublicIndexablePaths
>[number];
