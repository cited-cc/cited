#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

/** @typedef {{ ruleId: string; path: string; message: string }} Violation */
/** @type {Violation[]} */
const violations = [];

function addViolation(ruleId, path, message) {
  violations.push({ ruleId, path, message });
}

function exists(path) {
  try {
    statSync(join(repoRoot, path));
    return true;
  } catch {
    return false;
  }
}

function read(path) {
  return readFileSync(join(repoRoot, path), "utf8");
}

const REQUIRED_FILES = [
  "lib/monitoring/state-machine.ts",
  "lib/monitoring/provider-task-state.ts",
  "lib/monitoring/load-competitors.ts",
  "lib/monitoring/config-snapshot.ts",
  "lib/monitoring/limits.ts",
  "lib/monitoring/scan-transitions.ts",
  "lib/monitoring/observability.ts",
  "lib/classification/contract.ts",
  "docs/open-source/monitoring-engine.md",
  "supabase/migrations/20260904190000_cited_phase9_monitoring_lifecycle.sql",
  "tests/monitoring-state-machine.test.ts",
  "tests/monitoring-competitors.test.ts",
  "tests/monitoring-lifecycle.test.ts",
];

for (const file of REQUIRED_FILES) {
  if (!exists(file)) {
    addViolation("required-file", file, "Required Phase 9 monitoring file is missing.");
  }
}

const executeSource = exists("lib/monitoring/execute-scan-run.ts")
  ? read("lib/monitoring/execute-scan-run.ts")
  : "";

if (executeSource.includes("competitorHostnames: []")) {
  addViolation(
    "competitor-wiring",
    "lib/monitoring/execute-scan-run.ts",
    "Paid monitoring must not hardcode empty competitorHostnames.",
  );
}

if (!executeSource.includes("loadCompetitorsForScan")) {
  addViolation(
    "competitor-wiring",
    "lib/monitoring/execute-scan-run.ts",
    "execute-scan-run must load competitors via loadCompetitorsForScan.",
  );
}

const stateMachineSource = exists("lib/monitoring/state-machine.ts")
  ? read("lib/monitoring/state-machine.ts")
  : "";

if (!stateMachineSource.includes("SCAN_TERMINAL_PHASES")) {
  addViolation(
    "state-machine",
    "lib/monitoring/state-machine.ts",
    "Scan state machine must define terminal phases.",
  );
}

if (!stateMachineSource.includes("assertScanTransition")) {
  addViolation(
    "state-machine",
    "lib/monitoring/state-machine.ts",
    "Scan state machine must validate transitions.",
  );
}

const errorsSource = exists("lib/monitoring/errors.ts")
  ? read("lib/monitoring/errors.ts")
  : "";

if (!errorsSource.includes("internal_persistence_error")) {
  addViolation(
    "retry-policy",
    "lib/monitoring/errors.ts",
    "internal_persistence_error must be defined for retry policy.",
  );
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".git" || entry === ".next") continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|tsx|mjs)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

const testFiles = walk(join(repoRoot, "tests"));
for (const file of testFiles) {
  const rel = file.slice(repoRoot.length + 1);
  const source = readFileSync(file, "utf8");
  if (
    /\bfetch\s*\(\s*['"`]https:\/\/api\.dataforseo/i.test(source) ||
    /\baxios\.[a-z]+\(\s*['"`]https:\/\/api\.dataforseo/i.test(source)
  ) {
    addViolation(
      "live-provider-test",
      rel,
      "Monitoring tests must not contact live DataForSEO endpoints.",
    );
  }
}

const packageJson = JSON.parse(read("package.json"));
if (!packageJson.scripts?.["monitoring:check"]) {
  addViolation(
    "monitoring-script",
    "package.json",
    'Missing npm script "monitoring:check".',
  );
}

if (violations.length > 0) {
  console.error("monitoring:check failed\n");
  for (const v of violations) {
    console.error(`[${v.ruleId}] ${v.path}: ${v.message}`);
  }
  process.exit(1);
}

console.log("monitoring:check ok");
