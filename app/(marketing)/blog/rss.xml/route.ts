import { getAllBlogArticles } from "@/lib/content/blog";
import { absoluteUrl } from "@/lib/seo/site";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const articles = getAllBlogArticles();
  const lastBuildDate = new Date(
    articles[0]?.updatedAt ?? "2026-07-09",
  ).toUTCString();

  const items = articles
    .map((article) => {
      const link = absoluteUrl(article.canonicalPath);
      const pubDate = new Date(article.publishedAt).toUTCString();
      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(article.description)}</description>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(article.author)}</author>
      <category>${escapeXml(article.category)}</category>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Cited Blog</title>
    <link>${escapeXml(absoluteUrl("/blog"))}</link>
    <description>Field notes on AI citation monitoring, AI search evidence, and LLM visibility.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
