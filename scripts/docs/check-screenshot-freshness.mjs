#!/usr/bin/env node
/**
 * Compare committed screenshot manifest hash against current files.
 */
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = process.cwd();
const MANIFEST = join(REPO_ROOT, "docs/assets/screenshot-manifest.json");
const SCREENSHOT_DIR = join(REPO_ROOT, "docs/assets/screenshots");

const REQUIRED = [
  "dashboard.png",
  "monitors.png",
  "citation-evidence.png",
  "competitor-tracking.png",
  "missed-opportunities.png",
  "inbox.png",
  "notebook.png",
  "provider-settings.png",
];

function hashFile(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function main() {
  if (!existsSync(MANIFEST)) {
    console.error("screenshot-freshness: FAIL (manifest missing; run npm run docs:screenshots)");
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  const current = {};
  for (const file of REQUIRED) {
    const path = join(SCREENSHOT_DIR, file);
    if (!existsSync(path)) {
      console.error(`screenshot-freshness: FAIL (missing ${file})`);
      process.exit(1);
    }
    current[file] = hashFile(path);
  }

  const recorded = Object.fromEntries(
    (manifest.captures ?? [])
      .filter((entry) => entry.sha256)
      .map((entry) => [entry.file, entry.sha256]),
  );

  let stale = false;
  for (const file of REQUIRED) {
    if (recorded[file] && recorded[file] !== current[file]) {
      console.error(`screenshot-freshness: stale ${file}`);
      stale = true;
    }
  }

  if (stale) {
    console.error("screenshot-freshness: FAIL (re-run npm run docs:screenshots and commit manifest)");
    process.exit(1);
  }

  console.log("screenshot-freshness: PASS");
}

main();
