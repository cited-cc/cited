#!/usr/bin/env node
/**
 * Internal documentation link checker. External links are intentionally excluded.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  REPO_ROOT,
  listMarkdownFiles,
  checkInternalLinks,
  reportAndExit,
} from "./lib.mjs";

function main() {
  const roots = [
    join(REPO_ROOT, "README.md"),
    ...listMarkdownFiles(join(REPO_ROOT, "docs")),
    join(REPO_ROOT, "CONTRIBUTING.md"),
    join(REPO_ROOT, "CHANGELOG.md"),
    join(REPO_ROOT, "ROADMAP.md"),
    join(REPO_ROOT, "SUPPORT.md"),
    join(REPO_ROOT, "SECURITY.md"),
  ].filter((file) => existsSync(file));

  for (const file of roots) {
    checkInternalLinks(file, readFileSync(file, "utf8"), { blocking: true });
  }

  reportAndExit("docs:links");
}

main();
