import { describe, expect, it } from "vitest";

import {
  DOCS_ARTICLES,
  DOCS_FAQ_ITEMS,
  DOCS_NAV_GROUPS,
  REQUIRED_DOCS_SLUGS,
  getAllDocsArticles,
  getDocsArticle,
  getRelatedArticles,
  searchDocs,
} from "@/lib/content/docs";
import { MARKETING_FOOTER } from "@/lib/content/marketing";
import { TERMINOLOGY } from "@/lib/content/terminology";
import { getPublicIndexablePaths } from "@/lib/seo/indexable-paths";
import { buildDocsMetadata } from "@/lib/seo/docs-metadata";

describe("docs registry", () => {
  it("includes all required docs pages", () => {
    for (const slug of REQUIRED_DOCS_SLUGS) {
      expect(DOCS_ARTICLES[slug]).toBeTruthy();
      expect(getDocsArticle(slug)?.slug).toBe(slug);
    }
  });

  it("keeps nav links resolvable", () => {
    for (const group of DOCS_NAV_GROUPS) {
      for (const slug of group.slugs) {
        expect(getDocsArticle(slug)).toBeTruthy();
      }
    }
  });

  it("has metadata for each route", () => {
    for (const article of getAllDocsArticles()) {
      expect(article.title.length).toBeGreaterThan(0);
      expect(article.description.length).toBeGreaterThan(20);
      expect(article.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const meta = buildDocsMetadata(article.slug);
      expect(meta.title).toBe(article.title);
      expect(meta.description).toBe(article.description);
    }
  });

  it("keeps related articles valid", () => {
    for (const article of getAllDocsArticles()) {
      for (const related of getRelatedArticles(article.slug)) {
        expect(REQUIRED_DOCS_SLUGS).toContain(related.slug as never);
      }
    }
  });

  it("includes docs routes in sitemap paths", () => {
    expect(getPublicIndexablePaths()).toContain("/docs");
    for (const slug of REQUIRED_DOCS_SLUGS) {
      expect(getPublicIndexablePaths()).toContain(`/docs/${slug}`);
    }
  });
});

describe("docs search", () => {
  it("returns expected local metadata results", () => {
    const results = searchDocs("citation inbox");
    expect(results.some((result) => result.slug === "citation-inbox")).toBe(
      true,
    );
  });

  it("handles empty query safely", () => {
    expect(searchDocs("")).toEqual([]);
    expect(searchDocs("   ")).toEqual([]);
  });
});

describe("docs FAQ", () => {
  it("keeps FAQ schema content identical to visible FAQ items", () => {
    expect(DOCS_FAQ_ITEMS.length).toBeGreaterThan(5);
    for (const item of DOCS_FAQ_ITEMS) {
      expect(item.question.endsWith("?")).toBe(true);
      expect(item.answer.length).toBeGreaterThan(10);
    }
  });

  it("rejects global AI-coverage and guarantee claims", () => {
    const blob = DOCS_FAQ_ITEMS.map((item) => item.answer).join(" ").toLowerCase();
    expect(blob).not.toContain("every ai conversation in the world");
    expect(blob).toContain("does not force ai providers");
    expect(blob).toContain("does not");
    const guaranteeItem = DOCS_FAQ_ITEMS.find((item) => item.id === "guarantee");
    expect(guaranteeItem?.answer.toLowerCase().startsWith("no.")).toBe(true);
  });
});

describe("footer links", () => {
  it("exposes valid public footer destinations", () => {
    const hrefs = MARKETING_FOOTER.flatMap((group) =>
      group.links.map((link) => link.href),
    );
    expect(hrefs).toContain("/docs");
    expect(hrefs).toContain("/docs/getting-started");
    expect(hrefs).toContain("/contact");
    expect(hrefs).toContain("/status");
    expect(hrefs).toContain("/terms");
    expect(hrefs).toContain("/privacy");
    expect(hrefs).toContain("/cookies");
    expect(hrefs).toContain("/acceptable-use");
    expect(hrefs).toContain("/refund-policy");
    expect(hrefs).toContain("/dpa");
    expect(hrefs).not.toContain("/subprocessors");
    expect(hrefs).not.toContain("https://www.producthunt.com");
  });
});

describe("terminology consistency", () => {
  it("keeps shared terminology definitions available for docs and popovers", () => {
    expect(TERMINOLOGY.citation.short).toContain("verified domain");
    expect(TERMINOLOGY.mention.short).toContain("without an attributable source");
    expect(TERMINOLOGY.missed_opportunity.short).toContain("competitor");
    expect(TERMINOLOGY.citation.docsHref).toContain("/docs/citations-vs-mentions");
  });
});
