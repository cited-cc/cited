#!/usr/bin/env node

import { join } from "node:path";

import {
  TARGET_VERSION,
  collectReleaseViolations,
  generateReleaseArtifacts,
  getGitStatus,
} from "../lib/release/release.mjs";

const repoRoot = process.cwd();
const outputDir = join(repoRoot, ".cited", "release", TARGET_VERSION);
const mode = process.env.CITED_RELEASE_MODE === "release" ? "release" : "candidate";

function main() {
  const status = getGitStatus(repoRoot);
  if (status.dirty) {
    console.error("release:artifacts: FAIL (dirty working tree)");
    process.exit(1);
  }

  const violations = collectReleaseViolations(repoRoot, { mode });
  if (violations.length > 0) {
    console.error(`release:artifacts: FAIL (${violations.length} preflight violations)`);
    for (const violation of violations) {
      console.error(JSON.stringify({ level: "error", ...violation }));
    }
    process.exit(1);
  }

  const result = generateReleaseArtifacts(repoRoot, outputDir);

  console.log("release:artifacts: PASS");
  console.log(
    JSON.stringify({
      level: "info",
      outputDir: result.outputDir,
      artifacts: result.artifacts,
    }),
  );
}

main();
