#!/usr/bin/env tsx
/**
 * Ping Google and Bing sitemaps and submit all indexable URLs to IndexNow.
 *
 * Usage:
 *   npm run seo:submit
 *   NEXT_PUBLIC_APP_URL=https://cited.cc npm run seo:submit
 */

import { buildPublicIndexablePaths } from "@/lib/seo/indexable-paths";
import {
  getIndexNowKeyLocation,
  getIndexNowUrlList,
  indexNowSubmissionSucceeded,
  pingSearchEngineSitemap,
  submitIndexNow,
  verifyIndexNowKeyFile,
} from "@/lib/seo/indexnow";
import { absoluteUrl } from "@/lib/seo/site";

async function main() {
  const sitemapUrl = absoluteUrl("/sitemap.xml");
  const indexablePaths = buildPublicIndexablePaths();
  const indexNowUrls = getIndexNowUrlList();

  console.log(`Site origin: ${absoluteUrl("/")}`);
  console.log(`Sitemap: ${sitemapUrl}`);
  console.log(`Indexable paths: ${indexablePaths.length}`);
  console.log(`IndexNow key: ${getIndexNowKeyLocation()}`);
  console.log("");

  const keyReady = await verifyIndexNowKeyFile();
  console.log(
    `IndexNow key file: ${keyReady ? "ready" : "missing or invalid (deploy required)"}`,
  );
  console.log("");

  const google = await pingSearchEngineSitemap("google", sitemapUrl);
  console.log(
    `Google sitemap ping: ${google.status} ${google.ok ? "ok" : google.deprecated ? "deprecated endpoint" : "failed"}`,
  );

  const bing = await pingSearchEngineSitemap("bing", sitemapUrl);
  console.log(
    `Bing sitemap ping: ${bing.status} ${bing.ok ? "ok" : bing.deprecated ? "deprecated endpoint" : "failed"}`,
  );

  const indexNowResults = await submitIndexNow(indexNowUrls);
  for (const result of indexNowResults) {
    const host = result.endpoint.replace(/^https?:\/\//, "");
    console.log(
      `IndexNow ${host}: ${result.status} (${result.urlCount} URLs) ${result.ok ? "ok" : "failed"}`,
    );
    if (result.body.trim() && !result.ok) {
      console.log(result.body.trim());
    }
  }

  console.log("");
  console.log("Discovery files:");
  console.log(`- ${absoluteUrl("/llms.txt")}`);
  console.log(`- ${absoluteUrl("/ai.txt")}`);
  console.log(`- ${absoluteUrl("/llms-full.txt")}`);
  console.log(`- ${absoluteUrl("/blog/rss.xml")}`);
  console.log(`- ${absoluteUrl("/.well-known/security.txt")}`);

  const indexNowOk = indexNowSubmissionSucceeded(indexNowResults);
  if (!indexNowOk) {
    console.log("");
    console.log(
      "Bing may require cited.cc verification in Bing Webmaster Tools before accepting IndexNow.",
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
