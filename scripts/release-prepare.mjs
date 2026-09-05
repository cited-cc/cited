#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  TARGET_VERSION,
  getGitStatus,
  readJsonFile,
} from "../lib/release/release.mjs";

const repoRoot = process.cwd();
const metadataPath = join(repoRoot, "config/repository-metadata.json");

function fail(ruleId, path, message) {
  console.error(
    JSON.stringify({
      level: "error",
      ruleId,
      path,
      message,
    }),
  );
  process.exit(1);
}

function main() {
  const status = getGitStatus(repoRoot);
  if (status.dirty) {
    fail("dirty-tree", ".", "release:prepare refuses a dirty working tree.");
  }

  if (status.tags.includes(`v${TARGET_VERSION}`)) {
    fail("tag-exists", `.git/refs/tags/v${TARGET_VERSION}`, "Release version tag already exists.");
  }

  const pkgPath = join(repoRoot, "package.json");
  const pkg = readJsonFile(repoRoot, "package.json");
  if (pkg.version !== TARGET_VERSION) {
    pkg.version = TARGET_VERSION;
    writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
    console.log(`Updated package.json version to ${TARGET_VERSION}`);
  }

  const metadata = readJsonFile(repoRoot, metadataPath);
  metadata.version = TARGET_VERSION;
  writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  console.log(`Updated ${metadataPath} version to ${TARGET_VERSION}`);

  const supportPath = join(repoRoot, "lib/content/support.ts");
  let supportContent = readFileSync(supportPath, "utf8");
  const versionPattern = /export const APP_VERSION_LABEL = "[^"]+";/;
  if (!versionPattern.test(supportContent)) {
    fail("support-version-missing", supportPath, "APP_VERSION_LABEL not found.");
  }
  supportContent = supportContent.replace(
    versionPattern,
    `export const APP_VERSION_LABEL = "${TARGET_VERSION}";`,
  );
  writeFileSync(supportPath, supportContent, "utf8");
  console.log(`Updated APP_VERSION_LABEL to ${TARGET_VERSION}`);

  console.log("release:prepare: PASS (local files only, no push or publish)");
}

main();
