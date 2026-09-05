#!/usr/bin/env node

import { relative } from "node:path";
import {
  fileExists,
  formatFindingsForOutput,
  resolvePolicyPath,
  runPublicationCheck,
} from "../lib/publication/readiness.mjs";

const REPO_ROOT = process.cwd();
const POLICY_PATH = resolvePolicyPath(REPO_ROOT, "config/publication-policy.json");

function printSummary(result) {
  const formatted = formatFindingsForOutput(result.findings);
  const blockingCount = result.blocking.length;
  const warningCount = result.warnings.length;

  if (result.error) {
    console.error("publication-check: policy error");
    console.error(JSON.stringify({ level: "error", message: result.error }));
  }

  console.error(
    `publication-check: ${result.ok ? "PASS" : "FAIL"} (${blockingCount} blocking, ${warningCount} warnings)`,
  );

  for (const finding of formatted) {
    console.error(
      JSON.stringify({
        level: finding.severity === "blocking" ? "error" : "warn",
        severity: finding.severity,
        ruleId: finding.ruleId,
        category: finding.category,
        path: finding.path,
        message: finding.message,
      }),
    );
  }
}

function main() {
  if (!fileExists(POLICY_PATH)) {
    console.error("publication-check: FAIL (policy missing)");
    console.error(
      JSON.stringify({
        level: "error",
        severity: "blocking",
        ruleId: "policy-missing",
        category: "policy",
        path: relative(REPO_ROOT, POLICY_PATH),
        message: "Publication policy file is missing.",
      }),
    );
    process.exit(1);
  }

  const result = runPublicationCheck({
    repoRoot: REPO_ROOT,
    policyPath: POLICY_PATH,
  });

  printSummary(result);
  process.exit(result.ok ? 0 : 1);
}

main();
