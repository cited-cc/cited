import { buildSitemapEntries, buildSitemapXml } from "@/lib/seo/sitemap-xml";

/**
 * Build a sitemap Response that always returns HTTP 200 with a full XML body.
 * Static CDN files can answer 304 to conditional requests; GSC treats that as
 * "Couldn't fetch".
 */
export function createSitemapResponse(): Response {
  const entries = buildSitemapEntries();
  if (entries.length === 0) {
    return new Response("Sitemap unavailable", { status: 404 });
  }

  return new Response(buildSitemapXml(entries), {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
