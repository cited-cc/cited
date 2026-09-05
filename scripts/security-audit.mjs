#!/usr/bin/env node
/**
 * Read-only dependency advisory lookup via npm audit.
 * Does not modify lockfile or apply upgrades automatically.
 */
import { execFileSync } from "node:child_process";

const repoRoot = process.cwd();

function runAudit() {
  try {
    const output = execFileSync(
      "npm",
      ["audit", "--json", "--audit-level=moderate"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, npm_config_audit: "true" },
      },
    );
    return { ok: true, output };
  } catch (error) {
    const stdout = error?.stdout?.toString?.() ?? "";
    const stderr = error?.stderr?.toString?.() ?? "";
    if (stdout) {
      return { ok: false, output: stdout, stderr };
    }
    return { ok: false, output: "", stderr: stderr || String(error) };
  }
}

function summarizeAudit(jsonText) {
  if (!jsonText) {
    return { incomplete: true, critical: 0, high: 0, moderate: 0, low: 0 };
  }
  try {
    const parsed = JSON.parse(jsonText);
    const meta = parsed.metadata?.vulnerabilities ?? {};
    return {
      incomplete: false,
      critical: meta.critical ?? 0,
      high: meta.high ?? 0,
      moderate: meta.moderate ?? 0,
      low: meta.low ?? 0,
      total: meta.total ?? 0,
    };
  } catch {
    return { incomplete: true, critical: 0, high: 0, moderate: 0, low: 0 };
  }
}

const result = runAudit();
const summary = summarizeAudit(result.output);

if (result.incomplete || summary.incomplete) {
  console.error("security-audit: INCOMPLETE");
  console.error(
    JSON.stringify({
      level: "warn",
      ruleId: "audit-incomplete",
      category: "dependency-policy",
      message: "npm audit could not produce a full advisory report.",
    }),
  );
  process.exit(0);
}

console.log("security-audit: PASS");
console.log(
  JSON.stringify({
    level: "info",
    ruleId: "audit-summary",
    category: "dependency-policy",
    critical: summary.critical,
    high: summary.high,
    moderate: summary.moderate,
    low: summary.low,
    total: summary.total,
  }),
);

if (summary.critical > 0 || summary.high > 0) {
  console.error(
    JSON.stringify({
      level: "warn",
      ruleId: "audit-findings-present",
      category: "dependency-policy",
      message: "Critical or high advisories reported. Review before release.",
    }),
  );
}

process.exit(0);
