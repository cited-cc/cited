import {
  getPathLastModified,
  getPublicIndexablePaths,
} from "@/lib/seo/indexable-paths";
import {
  ORGANIZATION,
  absoluteUrl,
  isIndexableDeployment,
} from "@/lib/seo/site";

export type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency: "weekly" | "monthly";
  priority: number;
};

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function sitemapUrl(path: string): string {
  if (path === "/") {
    return `${ORGANIZATION.url}/`;
  }
  return absoluteUrl(path);
}

function getPriority(path: string): number {
  if (path === "/") {
    return 1;
  }
  if (path === "/pricing" || path === "/scan") {
    return 0.9;
  }
  if (path.startsWith("/blog/") || path.startsWith("/docs/")) {
    return 0.8;
  }
  return 0.7;
}

function getChangeFrequency(path: string): "weekly" | "monthly" {
  return path === "/" ? "weekly" : "monthly";
}

export function buildSitemapEntries(): SitemapEntry[] {
  if (!isIndexableDeployment()) {
    return [];
  }

  return getPublicIndexablePaths().map((path) => ({
    url: sitemapUrl(path),
    lastModified: getPathLastModified(path),
    changeFrequency: getChangeFrequency(path),
    priority: getPriority(path),
  }));
}

function formatLastMod(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function buildSitemapXml(
  entries: SitemapEntry[] = buildSitemapEntries(),
): string {
  const urls = entries
    .map((entry) => {
      const lastmod = formatLastMod(entry.lastModified);
      return `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
