import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  BLOG_ARTICLES,
  BLOG_INDEX,
  REQUIRED_BLOG_SLUGS,
  getAllBlogArticles,
  getBlogArticle,
  getBlogPath,
  getRelatedBlogArticles,
} from "@/lib/content/blog";
import { DOCS_ARTICLES, REQUIRED_DOCS_SLUGS } from "@/lib/content/docs";
import { MARKETING_FOOTER, MARKETING_NAV } from "@/lib/content/marketing";
import {
  setDeploymentModeOverrideForTests,
} from "@/lib/deployment/config";
import { resetDeploymentCacheForTests } from "@/lib/deployment/mode";
import {
  buildBlogArticleMetadata,
  buildBlogIndexMetadata,
  getBlogPostingJsonLd,
} from "@/lib/seo/blog-metadata";
import { getPublicIndexablePaths } from "@/lib/seo/indexable-paths";
import { absoluteUrl } from "@/lib/seo/site";

const BANNED_PHRASES = [
  "in today's digital landscape",
  "unlock the power",
  "supercharge",
  "revolutionize",
  "game-changer",
  "harness the power",
  "leverage ai",
  "delve",
  "dive into",
  "cutting-edge",
  "transform your business",
  "skyrocket",
  "10x",
  "product hunt",
  "producthunt",
];

describe("blog registry", () => {
  it("includes all required blog articles", () => {
    for (const slug of REQUIRED_BLOG_SLUGS) {
      expect(BLOG_ARTICLES[slug]).toBeTruthy();
      expect(getBlogArticle(slug)?.slug).toBe(slug);
    }
  });

  it("builds metadata and canonical URLs for each article", () => {
    for (const article of getAllBlogArticles()) {
      expect(article.title.length).toBeGreaterThan(0);
      expect(article.description.length).toBeGreaterThan(40);
      expect(article.canonicalPath).toBe(getBlogPath(article.slug));
      expect(article.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.faq.length).toBeGreaterThan(0);

      const meta = buildBlogArticleMetadata(article.slug);
      expect(meta.description).toBe(article.description);
      expect(meta.alternates?.canonical).toBe(
        absoluteUrl(article.canonicalPath),
      );
    }
  });

  it("keeps related article links valid", () => {
    for (const article of getAllBlogArticles()) {
      const related = getRelatedBlogArticles(article.slug);
      expect(related.length).toBeGreaterThan(0);
      for (const item of related) {
        expect(REQUIRED_BLOG_SLUGS).toContain(item.slug as never);
      }
    }
  });

  it("includes blog routes in sitemap paths", () => {
    expect(getPublicIndexablePaths()).toContain("/blog");
    for (const slug of REQUIRED_BLOG_SLUGS) {
      expect(getPublicIndexablePaths()).toContain(`/blog/${slug}`);
    }
    expect(getPublicIndexablePaths()).toContain("/docs/llms");
  });
});

describe("blog index SEO", () => {
  it("exposes index metadata and RSS alternate", () => {
    const meta = buildBlogIndexMetadata();
    expect(meta.description).toBe(BLOG_INDEX.description);
    expect(meta.alternates?.canonical).toBe(absoluteUrl("/blog"));
    const types = meta.alternates?.types as Record<string, string> | undefined;
    expect(types?.["application/rss+xml"]).toBe(absoluteUrl("/blog/rss.xml"));
  });

  it("exposes BlogPosting schema fields", () => {
    for (const article of getAllBlogArticles()) {
      const schema = getBlogPostingJsonLd(article);
      expect(schema["@type"]).toBe("BlogPosting");
      expect(schema.headline).toBe(article.title);
      expect(schema.datePublished).toBe(article.publishedAt);
      expect(schema.dateModified).toBe(article.updatedAt);
      expect(schema.author).toEqual({
        "@type": "Organization",
        name: "Cited",
      });
      expect(
        (schema.mainEntityOfPage as { "@id": string })["@id"],
      ).toBe(absoluteUrl(article.canonicalPath));
    }
  });
});

describe("blog content guardrails", () => {
  it("rejects banned AI-slop phrases and Product Hunt references", () => {
    const blob = getAllBlogArticles()
      .map((article) =>
        [
          article.title,
          article.description,
          article.markdown,
          ...article.faq.map((item) => `${item.question} ${item.answer}`),
        ].join("\n"),
      )
      .join("\n")
      .toLowerCase();

    for (const phrase of BANNED_PHRASES) {
      expect(blob).not.toContain(phrase);
    }
  });

  it("rejects global monitoring and guaranteed citation claims", () => {
    const blob = getAllBlogArticles()
      .map((article) => article.markdown)
      .join("\n")
      .toLowerCase();

    expect(blob).toContain("does not");
    expect(blob).not.toMatch(
      /(?<!does not |do not |cannot |never )guarantee more (ai )?citations/,
    );
    expect(blob).not.toContain("every ai conversation in the world");
  });

  it("keeps FAQ answers honest about limits", () => {
    for (const article of getAllBlogArticles()) {
      const answers = article.faq.map((item) => item.answer.toLowerCase());
      const blob = answers.join(" ");
      expect(answers.some((answer) => answer.startsWith("no."))).toBe(true);
      expect(
        blob.includes("does not") ||
          blob.includes("out of scope") ||
          blob.includes("only checks") ||
          blob.includes("only evaluates"),
      ).toBe(true);
    }
  });
});

describe("footer and nav LLM links", () => {
  it("includes blog and LLM destinations", () => {
    const hrefs = MARKETING_FOOTER.flatMap((group) =>
      group.links.map((link) => link.href),
    );
    expect(hrefs).toContain("/blog");
    expect(hrefs).toContain("/docs/llms");
    expect(hrefs).toContain("/llms.txt");
    expect(hrefs).toContain("/llms-full.txt");
    expect(hrefs).toContain("/ai.txt");
    expect(hrefs).not.toContain("https://www.producthunt.com");

    const navHrefs = MARKETING_NAV.map((item) => item.href);
    expect(navHrefs).toEqual(["/pricing", "/docs", "/blog", "/scan"]);
  });
});

describe("docs llms page", () => {
  it("registers /docs/llms in the docs system", () => {
    expect(REQUIRED_DOCS_SLUGS).toContain("llms");
    expect(DOCS_ARTICLES.llms?.title).toBe("Cited LLM Files");
    expect(DOCS_ARTICLES.llms?.description.toLowerCase()).toContain(
      "llm-readable",
    );
  });
});

describe("llms route source", () => {
  it("keeps llms.txt and llms-full.txt as text/plain route handlers", async () => {
    const llmsSource = readFileSync(
      join(process.cwd(), "app/llms.txt/route.ts"),
      "utf8",
    );
    const llmsFullSource = readFileSync(
      join(process.cwd(), "app/llms-full.txt/route.ts"),
      "utf8",
    );
    const generateSitemapSource = readFileSync(
      join(process.cwd(), "scripts/seo/generate-sitemap.ts"),
      "utf8",
    );
    const sitemapRouteSource = readFileSync(
      join(process.cwd(), "app/sitemap.xml/route.ts"),
      "utf8",
    );
    const rss = readFileSync(
      join(process.cwd(), "app/(marketing)/blog/rss.xml/route.ts"),
      "utf8",
    );

    expect(llmsSource).toContain("DISCOVERY_TEXT_HEADERS");
    expect(llmsSource).toContain("buildLlmsTxtBody");

    expect(llmsFullSource).toContain("DISCOVERY_TEXT_HEADERS");
    expect(llmsFullSource).toContain("buildLlmsFullTxtBody");

    expect(generateSitemapSource).toContain("buildSitemapEntries");
    expect(sitemapRouteSource).toContain("createSitemapResponse");

    expect(rss).toContain("application/rss+xml; charset=utf-8");
    expect(rss).toContain("getAllBlogArticles");

    const { GET: getLlms } = await import("@/app/llms.txt/route");
    const { GET: getLlmsFull } = await import("@/app/llms-full.txt/route");
    const { GET: getSitemap } = await import("@/app/sitemap.xml/route");
    const llmsResponse = await getLlms();
    const llmsFullResponse = await getLlmsFull();

    const previousVercelEnv = process.env.VERCEL_ENV;
    const previousMode = process.env.CITED_DEPLOYMENT_MODE;
    const previousPublic = process.env.NEXT_PUBLIC_CITED_DEPLOYMENT_MODE;
    setDeploymentModeOverrideForTests("self_hosted");
    resetDeploymentCacheForTests();
    process.env.NEXT_PUBLIC_CITED_DEPLOYMENT_MODE = "self_hosted";
    process.env.VERCEL_ENV = "production";
    let sitemapResponse: Awaited<ReturnType<typeof getSitemap>>;
    try {
      sitemapResponse = await getSitemap();
    } finally {
      setDeploymentModeOverrideForTests(null);
      resetDeploymentCacheForTests();
      if (previousMode === undefined) delete process.env.CITED_DEPLOYMENT_MODE;
      else process.env.CITED_DEPLOYMENT_MODE = previousMode;
      if (previousPublic === undefined) {
        delete process.env.NEXT_PUBLIC_CITED_DEPLOYMENT_MODE;
      } else {
        process.env.NEXT_PUBLIC_CITED_DEPLOYMENT_MODE = previousPublic;
      }
      if (previousVercelEnv === undefined) {
        delete process.env.VERCEL_ENV;
      } else {
        process.env.VERCEL_ENV = previousVercelEnv;
      }
    }

    const llmsBody = await llmsResponse.text();
    const llmsFullBody = await llmsFullResponse.text();
    const sitemapBody = await sitemapResponse.text();

    expect(llmsResponse.headers.get("Content-Type")).toBe(
      "text/plain; charset=utf-8",
    );
    expect(llmsResponse.headers.get("Cross-Origin-Resource-Policy")).toBe(
      "cross-origin",
    );
    expect(llmsFullResponse.headers.get("Content-Type")).toBe(
      "text/plain; charset=utf-8",
    );
    expect(llmsFullResponse.headers.get("Cross-Origin-Resource-Policy")).toBe(
      "cross-origin",
    );
    expect(sitemapResponse.status).toBe(404);
    expect(sitemapBody).toContain("Sitemap unavailable");
    expect(llmsBody).toContain("how-to-know-if-chatgpt-cites-your-website");
    expect(llmsBody).toContain("ai-citation-monitoring");
    expect(llmsBody).toContain("llm-visibility-audit");
    expect(llmsBody).toContain("is-my-brand-cited-in-chatgpt");
    expect(llmsBody).toContain("how-to-check-if-perplexity-cites-your-website");
    expect(llmsBody).toContain("are-you-showing-up-in-google-ai-overviews");
    expect(llmsBody).toContain("geo-vs-seo-what-citation-evidence-actually-is");
    expect(llmsBody).toContain("ai-citation-checker");
    expect(llmsBody).toContain("/blog/rss.xml");
    expect(llmsBody).toContain("/ai.txt");
    expect(llmsBody).toContain("/sitemap.xml");
    expect(llmsBody).toContain("Portfolio");
    expect(llmsBody).toContain("$199");
    expect(llmsBody).not.toContain("/sitemap-index.xml");
    expect(llmsBody).not.toContain("/sitemap/sitemap.xml");
    expect(llmsFullBody.toLowerCase()).toContain("private ai conversations");
    expect(llmsFullBody.toLowerCase()).toContain("does not guarantee");
  });
});

describe("robots does not block LLM files", () => {
  it("keeps robots allow-list free of llms.txt blocks", () => {
    const robots = readFileSync(join(process.cwd(), "app/robots.ts"), "utf8");
    expect(robots).toContain('allow: "/"');
    expect(robots).not.toContain("/llms.txt");
    expect(robots).not.toContain("/llms-full.txt");
  });
});

describe("blog page modules exist", () => {
  it("has route modules for index and all articles", () => {
    const roots = [
      "app/(marketing)/blog/page.tsx",
      "app/(marketing)/blog/how-to-know-if-chatgpt-cites-your-website/page.tsx",
      "app/(marketing)/blog/ai-citation-monitoring/page.tsx",
      "app/(marketing)/blog/llm-visibility-audit/page.tsx",
      "app/(marketing)/blog/is-my-brand-cited-in-chatgpt/page.tsx",
      "app/(marketing)/blog/how-to-check-if-perplexity-cites-your-website/page.tsx",
      "app/(marketing)/blog/are-you-showing-up-in-google-ai-overviews/page.tsx",
      "app/(marketing)/blog/geo-vs-seo-what-citation-evidence-actually-is/page.tsx",
      "app/(marketing)/blog/ai-citation-checker/page.tsx",
      "app/(marketing)/docs/llms/page.tsx",
    ];
    for (const file of roots) {
      expect(() => readFileSync(join(process.cwd(), file), "utf8")).not.toThrow();
    }
  });
});
