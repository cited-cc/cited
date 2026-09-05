#!/usr/bin/env node

import { runLicenseCheck } from "../lib/license/dependency-licenses.mjs";

const REPO_ROOT = process.cwd();

function main() {
  let result;
  try {
    result = runLicenseCheck(REPO_ROOT);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown license check error.";
    console.error("license-check: FAIL");
    console.error(JSON.stringify({ level: "error", message }));
    process.exit(1);
  }

  const blockingCount = result.blocking.length;
  const reviewCount = result.review.length;

  console.error(
    `license-check: ${result.ok ? "PASS" : "FAIL"} (${blockingCount} blocking, ${reviewCount} flagged for review)`,
  );

  for (const finding of result.findings) {
    const level =
      finding.category === "permissive"
        ? "info"
        : finding.category === "disallowed"
          ? "error"
          : "warn";

    console.error(
      JSON.stringify({
        level,
        package: finding.name,
        version: finding.version,
        license: finding.license,
        category: finding.category,
        message: finding.reason,
      }),
    );
  }

  process.exit(result.ok ? 0 : 1);
}

main();
