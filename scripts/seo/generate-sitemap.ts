#!/usr/bin/env tsx
/**
 * Prebuild validation: ensure sitemap entries are non-empty and match indexable paths.
 * Community self-hosted builds skip cited.cc sitemap validation.
 */

async function main() {
  if (process.env.CITED_DEPLOYMENT_MODE === "self_hosted") {
    console.log(
      "Skipping cited.cc sitemap validation for self_hosted community builds.",
    );
    return;
  }

  const { buildPublicIndexablePaths } = await import("@/lib/seo/indexable-paths");
  const { buildSitemapEntries } = await import("@/lib/seo/sitemap-xml");

  process.env.VERCEL_ENV ??= "production";
  process.env.NEXT_PUBLIC_APP_URL ??= "https://cited.cc";
  process.env.CITED_DEPLOYMENT_MODE ??= "cloud";
  process.env.NEXT_PUBLIC_CITED_DEPLOYMENT_MODE ??= "cloud";

  const entries = buildSitemapEntries();
  const paths = buildPublicIndexablePaths();

  if (entries.length === 0) {
    throw new Error("Refusing to ship an empty sitemap");
  }

  if (entries.length !== paths.length) {
    throw new Error(
      `Sitemap entry count (${entries.length}) does not match indexable paths (${paths.length})`,
    );
  }

  console.log(`Validated sitemap (${entries.length} URLs).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
