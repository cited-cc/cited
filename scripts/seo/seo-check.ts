#!/usr/bin/env tsx
/**
 * Validate SEO and AI discoverability invariants before deploy.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { REQUIRED_BLOG_SLUGS } from "@/lib/content/blog";
import { REQUIRED_DOCS_SLUGS } from "@/lib/content/docs";
import {
  buildPublicIndexablePaths,
  getLatestContentUpdatedDate,
  getPublicIndexablePaths,
} from "@/lib/seo/indexable-paths";
import { INDEXNOW_KEY } from "@/lib/seo/indexnow";
import { buildAiTxtBody, buildLlmsFullTxtBody, buildLlmsTxtBody } from "@/lib/seo/llms-content";
import { CANONICAL_SITEMAP_PATH, canonicalSitemapUrl } from "@/lib/seo/site";
import { buildSitemapEntries, buildSitemapXml } from "@/lib/seo/sitemap-xml";
import { getPublicDeploymentMode } from "@/lib/deployment/public-config";
import robots from "@/app/robots";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const paths = buildPublicIndexablePaths();
  assert(paths.length > 0, "Expected indexable paths");
  assert(
    JSON.stringify(paths) === JSON.stringify(getPublicIndexablePaths()),
    "getPublicIndexablePaths() is out of sync with buildPublicIndexablePaths()",
  );

  for (const slug of REQUIRED_DOCS_SLUGS) {
    assert(
      getPublicIndexablePaths().includes(`/docs/${slug}`),
      `Missing docs slug in sitemap paths: ${slug}`,
    );
  }

  for (const slug of REQUIRED_BLOG_SLUGS) {
    assert(
      getPublicIndexablePaths().includes(`/blog/${slug}`),
      `Missing blog slug in sitemap paths: ${slug}`,
    );
  }

  assert(
    !getPublicIndexablePaths().includes("/docs/slack-alerts"),
    "Redirect-only /docs/slack-alerts must not be in sitemap paths",
  );

  const llms = buildLlmsTxtBody();
  const ai = buildAiTxtBody();
  const llmsFull = buildLlmsFullTxtBody();
  const generatedAt = getLatestContentUpdatedDate();

  assert(llms.includes("/blog/rss.xml"), "llms.txt must link blog RSS");
  assert(llms.includes("/ai.txt"), "llms.txt must link ai.txt");
  assert(llms.includes(CANONICAL_SITEMAP_PATH), "llms.txt must link sitemap");
  assert(llms.includes("Portfolio"), "llms.txt must include Portfolio");
  assert(llms.includes("$199"), "llms.txt must include Portfolio $199");
  assert(!llms.includes("/sitemap-index.xml"), "llms.txt must not advertise sitemap-index");
  assert(!llms.includes("/sitemap/sitemap.xml"), "llms.txt must not advertise nested sitemap copy");
  assert(!paths.includes("/launch"), "/launch must not be indexable");
  assert(!paths.includes("/status"), "/status must not be indexable");
  assert(ai.includes("/llms.txt"), "ai.txt must link llms.txt");
  assert(llmsFull.includes(`Generated: ${generatedAt}`), "llms-full must use latest content date");
  assert(
    REQUIRED_DOCS_SLUGS.every((slug) => llmsFull.includes(`/docs/${slug}`)),
    "llms-full must include every docs article URL",
  );

  const keyFile = join(process.cwd(), "public", `${INDEXNOW_KEY}.txt`);
  const keyContents = readFileSync(keyFile, "utf8");
  assert(keyContents === INDEXNOW_KEY, "IndexNow key file must contain the key with no trailing newline");

  if (getPublicDeploymentMode() === "self_hosted") {
    console.log(
      `SEO check passed for self_hosted community build (${paths.length} documented paths; runtime sitemap indexing disabled).`,
    );
    return;
  }

  const previousVercelEnv = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  try {
    const sitemapEntries = buildSitemapEntries();
    const sitemapXml = buildSitemapXml(sitemapEntries);
    assert(sitemapEntries.length === paths.length, "Sitemap entry count must match indexable paths");
    assert(sitemapXml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), "Sitemap must declare XML encoding");
    assert(sitemapXml.includes("<urlset"), "Sitemap must include urlset root");
    assert(sitemapXml.includes("https://cited.cc/"), "Sitemap homepage must use cited.cc with trailing slash");
    assert(
      sitemapEntries.every((entry) => entry.url.startsWith("https://cited.cc")),
      "Every sitemap URL must use the cited.cc origin",
    );
    const lastmods = new Set(
      sitemapEntries.map((entry) => entry.lastModified.toISOString().slice(0, 10)),
    );
    assert(lastmods.size > 1, "Sitemap lastmod must vary by URL, not a single frozen date");
    const robotsResult = robots();
    assert(robotsResult.sitemap === canonicalSitemapUrl(), "robots sitemap must match canonical URL");
    assert(
      robotsResult.sitemap === `${"https://cited.cc"}${CANONICAL_SITEMAP_PATH}`,
      "robots and llms.txt must advertise the same sitemap path",
    );
  } finally {
    if (previousVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = previousVercelEnv;
    }
  }

  console.log(`SEO check passed (${paths.length} indexable paths).`);
}

main();
