#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

const SCAN_IGNORE_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  "dist",
  "coverage",
]);

const NEUTRAL_CORE_PREFIXES = [
  "lib/monitoring/",
  "lib/citations/",
  "lib/domains/",
  "lib/evidence/",
  "lib/export/",
  "lib/inbox/",
  "lib/notebook/",
  "lib/entitlements/",
];

const APPROVED_DATAFORSEO_IMPORT_PREFIXES = [
  "lib/providers/dataforseo/",
  "lib/providers/bootstrap.ts",
  "lib/providers/registry.ts",
  "lib/scan/provider.ts",
  "lib/monitoring/providers/dataforseo.ts",
  "lib/monitoring/dataforseo-provider.ts",
  "tests/",
];

const REQUIRED_PROVIDER_FILES = [
  "lib/providers/types.ts",
  "lib/providers/provider.ts",
  "lib/providers/registry.ts",
  "lib/providers/router.ts",
  "lib/providers/config.ts",
  "lib/providers/errors.ts",
  "lib/providers/normalization.ts",
  "lib/providers/index.ts",
  "lib/providers/bootstrap.ts",
  "lib/providers/mock/index.ts",
  "lib/providers/dataforseo/client.ts",
  "lib/providers/dataforseo/metadata.ts",
  "scripts/check-provider-boundaries.mjs",
  "scripts/provider-list.ts",
  "scripts/provider-doctor.ts",
  "docs/open-source/provider-adapters.md",
  "docs/open-source/providers/dataforseo.md",
  "docs/open-source/providers/mock.md",
  "tests/provider-contract.test.ts",
  "tests/provider-boundary-check.test.ts",
  "supabase/migrations/20260904180000_cited_phase8_monitoring_providers.sql",
];

const SECRET_PATTERNS = [
  /sk_live_[A-Za-z0-9]{16,}/,
  /DATAFORSEO_PASSWORD\s*=\s*['"][^'"]+['"]/,
  /Authorization:\s*Basic\s+[A-Za-z0-9+/=]{8,}/,
];

const PERSONAL_EMAIL_PATTERN =
  /[A-Za-z0-9._%+-]+@(?!example\.com|cited\.cc|localhost)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

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

function walk(dir, acc = []) {
  const absolute = join(repoRoot, dir);
  if (!exists(dir)) return acc;
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    if (SCAN_IGNORE_DIRS.has(entry.name)) continue;
    const rel = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(rel, acc);
    } else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
      acc.push(rel);
    }
  }
  return acc;
}

function isNeutralCore(path) {
  return NEUTRAL_CORE_PREFIXES.some(
    (prefix) => path.startsWith(prefix) || path === prefix,
  );
}

function isApprovedDataForSeoImport(path) {
  return APPROVED_DATAFORSEO_IMPORT_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix),
  );
}

for (const file of REQUIRED_PROVIDER_FILES) {
  if (!exists(file)) {
    addViolation("required-file", file, "Required provider architecture file is missing.");
  }
}

const configSource = read("lib/providers/config.ts");
if (!configSource.includes("CITED_MONITORING_PROVIDER")) {
  addViolation(
    "canonical-env",
    "lib/providers/config.ts",
    "Canonical CITED_MONITORING_PROVIDER variable is missing.",
  );
}

if (/import\s*\([^)]*\$\{/.test(read("lib/providers/registry.ts"))) {
  addViolation(
    "dynamic-import",
    "lib/providers/registry.ts",
    "Dynamic provider imports from configuration are forbidden.",
  );
}

const factorySource = read("lib/monitoring/factory.ts");
if (factorySource.includes("@/lib/providers/dataforseo/client")) {
  addViolation(
    "factory-direct-adapter",
    "lib/monitoring/factory.ts",
    "Monitoring factory must use the provider registry, not direct adapter imports.",
  );
}

for (const file of walk("lib/monitoring")) {
  if (isApprovedDataForSeoImport(file)) continue;
  const source = read(file);
  if (/from\s+["']@\/lib\/providers\/dataforseo/.test(source)) {
    addViolation(
      "core-dataforseo-import",
      file,
      "Core monitoring must not import DataForSEO directly.",
    );
  }
}

for (const file of walk("components")) {
  const source = read(file);
  if (/lib\/providers\/dataforseo|DATAFORSEO_/.test(source)) {
    addViolation(
      "client-provider-leak",
      file,
      "Client components must not reference provider credentials or adapters.",
    );
  }
}

for (const file of walk("tests/fixtures/dataforseo")) {
  if (!/\.json$/.test(file)) continue;
  const source = read(file);
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(source)) {
      addViolation("fixture-secret", file, "Fixture contains a forbidden secret pattern.");
    }
  }
  if (PERSONAL_EMAIL_PATTERN.test(source)) {
    addViolation("fixture-email", file, "Fixture contains a personal email pattern.");
  }
}

const cloudGuardSource = read("lib/providers/config.ts");
if (!cloudGuardSource.includes('readDeploymentModeForProviders() === "cloud"')) {
  addViolation(
    "mock-cloud-block",
    "lib/providers/config.ts",
    "Mock provider must be blocked in cloud deployment mode.",
  );
}

const clientSource = read("lib/providers/dataforseo/client.ts");
if (!clientSource.includes("DATAFORSEO_ALLOWED_HOSTS")) {
  addViolation(
    "endpoint-allowlist",
    "lib/providers/dataforseo/client.ts",
    "DataForSEO adapter must enforce endpoint allowlisting.",
  );
}

const envExamples = [".env.example", ".env.self-hosted.example", ".env.cloud.example"].filter(
  exists,
);
for (const file of envExamples) {
  const source = read(file);
  if (!source.includes("CITED_MONITORING_PROVIDER") && !source.includes("MONITORING_PROVIDER")) {
    addViolation(
      "env-example-provider",
      file,
      "Environment example must document monitoring provider selection.",
    );
  }
}

if (violations.length > 0) {
  console.error("provider:check failed:");
  for (const violation of violations) {
    console.error(`- [${violation.ruleId}] ${violation.path}: ${violation.message}`);
  }
  process.exit(1);
}

console.log("provider:check ok");
