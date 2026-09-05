import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { FINAL_CTA, HERO, MARKETING_FOOTER } from "@/lib/content/marketing";
import { getPublicIndexablePaths } from "@/lib/seo/indexable-paths";

const ROOT = process.cwd();

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

describe("marketing footer", () => {
  it("exposes required product, resources, AI-readable, company, and legal sections", () => {
    const titles = MARKETING_FOOTER.map((group) => group.title);
    expect(titles).toEqual([
      "Product",
      "Resources",
      "AI-readable",
      "Company",
      "Legal",
    ]);
  });

  it("keeps footer destinations resolvable and Product Hunt free", () => {
    const hrefs = MARKETING_FOOTER.flatMap((group) =>
      group.links.map((link) => link.href),
    );

    expect(hrefs).toContain("/scan");
    expect(hrefs).toContain("/demo");
    expect(hrefs).toContain("/pricing");
    expect(hrefs).toContain("/how-it-works");
    expect(hrefs).toContain("/blog");
    expect(hrefs).toContain("/docs");
    expect(hrefs).toContain("/docs/getting-started");
    expect(hrefs).toContain("/docs/citations-vs-mentions");
    expect(hrefs).toContain("/docs/troubleshooting");
    expect(hrefs).toContain("/docs/changelog");
    expect(hrefs).toContain("/docs/llms");
    expect(hrefs).toContain("/llms.txt");
    expect(hrefs).toContain("/llms-full.txt");
    expect(hrefs).toContain("/ai.txt");
    expect(hrefs).toContain("/contact");
    expect(hrefs).toContain("/security");
    expect(hrefs).toContain("/status");
    expect(hrefs).toContain("/terms");
    expect(hrefs).toContain("/privacy");
    expect(hrefs).toContain("/cookies");
    expect(hrefs).toContain("/acceptable-use");
    expect(hrefs).toContain("/refund-policy");
    expect(hrefs).toContain("/dpa");
    expect(hrefs).not.toContain("/subprocessors");
    expect(hrefs).not.toContain("https://www.producthunt.com");

    const nonSitemapPublicFiles = new Set([
      "/llms.txt",
      "/llms-full.txt",
      "/ai.txt",
      "/status",
    ]);
    for (const href of hrefs) {
      if (href.startsWith("/") && !nonSitemapPublicFiles.has(href)) {
        expect(getPublicIndexablePaths()).toContain(href);
      }
    }
  });

  it("renders branded product line in the footer component", () => {
    const source = readSource("components/marketing/marketing-footer.tsx");
    expect(source).toContain("citation inbox for AI search");
    expect(source).toContain("MARKETING_FOOTER");
    expect(source).not.toContain("producthunt");
  });
});

describe("post-footer bar", () => {
  it("mounts on marketing layout after the main footer", () => {
    const layout = readSource("app/(marketing)/layout.tsx");
    expect(layout).toContain("<MarketingFooter");
    expect(layout).toContain("<PostFooterBar");
    expect(layout.indexOf("<MarketingFooter")).toBeLessThan(
      layout.indexOf("<PostFooterBar"),
    );
  });

  it("does not mount on authenticated app layout", () => {
    const appLayout = readSource("app/app/layout.tsx");
    expect(appLayout).not.toContain("PostFooterBar");
    expect(appLayout).not.toContain("MarketingFooter");
  });

  it("includes required branded line and copyright", () => {
    const source = readSource("components/layout/post-footer-bar.tsx");
    expect(source).toContain("Built for people who want the receipt.");
    expect(source).toContain("© {COPYRIGHT_YEAR} Cited. All rights reserved.");
    expect(source).toContain("CITED");
    expect(source).toContain("SOURCE LEDGER");
    expect(source).toContain("Cited brand signature");
    expect(source).toContain('kind: "domain"');
    expect(source).toContain("text-cited-accent-bright");
  });

  it("does not add a broken Accomplish link when config is missing", () => {
    const source = readSource("components/layout/post-footer-bar.tsx");
    expect(source).not.toMatch(/accomplish\.(io|cc|com)/i);
    expect(source).not.toContain('href="https://accomplish');
    expect(source).toContain("No Accomplish link");
  });

  it("is reduced-motion safe and uses citation tokens", () => {
    const source = readSource("components/layout/post-footer-bar.tsx");
    const globals = readSource("app/globals.css");
    expect(source).toContain("cited-ledger-shimmer");
    expect(source).toContain("cited-brand-strip-track");
    expect(source).toContain("motion-reduce");
    expect(globals).toContain("cited-ledger-shimmer");
    expect(globals).toContain("cited-brand-marquee");
    expect(globals).toContain("cited-brand-strip-fade");
    expect(globals).toContain("prefers-reduced-motion");
    expect(globals).toContain("--cited-canvas: #fbf7f0");
    expect(globals).toContain("--cited-black: #15131a");
    expect(globals).toContain("--cited-accent-bright: #5ce1e6");
    expect(globals).toContain("--cited-citation: var(--cited-accent-bright)");
    expect(globals).toContain("--cited-yellow: var(--cited-accent-bright)");
    expect(globals).toContain("--font-bricolage");
    expect(globals).toContain("--font-onest");
    expect(globals).toContain("--font-ibm-plex-mono");
    expect(globals).toContain("color-scheme: light");
    expect(globals).toContain("color-scheme: dark");
    expect(globals).toContain('[data-theme="dark"]');
    expect(globals).toContain("--cited-inverse:");
  });
});

describe("homepage conversion copy", () => {
  it("keeps primary conversion path and demotes demo", () => {
    expect(HERO.primaryCta).toEqual({
      label: "Check a domain",
      href: "/scan",
    });
    expect(HERO.secondaryCta).toEqual({
      label: "See how it works",
      href: "/how-it-works",
    });
    expect(FINAL_CTA.primaryCta.href).toBe("/scan");
    expect(FINAL_CTA.secondaryCta.href).toBe("/pricing");
    expect(HERO.supporting.toLowerCase()).toContain("receipt");
  });

  it("renders a polished citation-note hero artifact with domain capture", () => {
    const home = readSource("app/(marketing)/page.tsx");
    const hero = readSource("components/marketing/hero-citation-preview.tsx");
    const content = readSource("lib/content/marketing.ts");
    expect(home).toContain("HeroCitationPreview");
    expect(home).toContain("HeroDomainCapture");
    expect(home).toContain("ProblemStrip");
    expect(home).toContain("HERO.headline");
    expect(content).toContain('label: "CITATION NOTE"');
    expect(content).toContain('badge: "CITATION FOUND"');
    expect(content).toContain("PROBLEM_SECTION");
    expect(hero).toContain("EXAMPLE_CITATION_NOTE");
    expect(hero).toContain("First seen by Cited");
    expect(hero).toContain("cited-evidence-sweep");
    expect(hero).toContain("cited-paper-texture");
    expect(hero).not.toContain("dashboard");
  });

  it("uses Cited-native artifact language on the homepage", () => {
    const features = readSource("lib/content/marketing.ts");
    expect(features).toContain("Citation Inbox");
    expect(features).toContain("Evidence Note");
    expect(features).toContain("Source Slip");
    expect(features).toContain("Occurrence Ledger");
    expect(features).not.toMatch(/unlock insights|supercharge|AI-powered platform/i);
  });
});
