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
  "lib/auth/identity.ts",
  "lib/auth/bootstrap.ts",
  "lib/auth/local-credentials.ts",
  "lib/auth/invitations.ts",
  "lib/auth/access-state.ts",
];

const APPROVED_SUPABASE_IMPORT_PREFIXES = [
  "lib/db/providers/supabase/",
  "lib/db/factory.ts",
  "lib/db/admin.ts",
  "lib/db/server.ts",
  "lib/db/health.ts",
  "scripts/seed-cited-demo.ts",
];

const REQUIRED_DB_FILES = [
  "lib/db/config.ts",
  "lib/db/factory.ts",
  "lib/db/errors.ts",
  "lib/db/health.ts",
  "lib/db/providers/postgres/query-builder.ts",
  "lib/db/providers/supabase/client.ts",
  "lib/db/repositories/index.ts",
  "lib/db/migrations/runner.mjs",
  "scripts/check-database-boundaries.mjs",
  "scripts/db-migrate.mjs",
  "scripts/db-status.mjs",
  "scripts/db-validate.mjs",
  "scripts/db-seed.mjs",
  "scripts/db-reset-local.mjs",
  "scripts/db-types-check.mjs",
  "docs/open-source/database.md",
  "supabase/seed.sql",
  "tests/database-boundary-check.test.ts",
  "tests/database-phase7.test.ts",
];

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
  return NEUTRAL_CORE_PREFIXES.some((prefix) => path.startsWith(prefix) || path === prefix);
}

function isApprovedSupabaseImport(path) {
  return APPROVED_SUPABASE_IMPORT_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix),
  );
}

function checkRequiredFiles() {
  for (const filePath of REQUIRED_DB_FILES) {
    if (!exists(filePath)) {
      addViolation("database-file-missing", filePath, "Required database artifact is missing.");
    }
  }
}

function checkNeutralCoreAvoidsSupabase() {
  for (const filePath of walk("lib")) {
    if (!isNeutralCore(filePath)) continue;
    const source = read(filePath);
    if (source.includes("@supabase/supabase-js")) {
      addViolation(
        "neutral-core-supabase-import",
        filePath,
        "Neutral core module must not import @supabase/supabase-js directly.",
      );
    }
  }
}

function checkSupabaseImportsApproved() {
  for (const filePath of walk(".")) {
    if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) continue;
    const source = read(filePath);
    if (!source.includes("@supabase/supabase-js")) continue;
    if (!isApprovedSupabaseImport(filePath)) {
      addViolation(
        "supabase-import-unapproved",
        filePath,
        "Direct Supabase imports must stay in approved provider modules.",
      );
    }
  }
}

function checkClientCannotImportDbProviders() {
  for (const filePath of walk("components")) {
    const source = read(filePath);
    if (source.includes("lib/db/providers/") || source.includes("lib/db/factory")) {
      addViolation(
        "client-db-provider-import",
        filePath,
        "Client components must not import server database providers.",
      );
    }
  }
}

function checkEnvExamples() {
  const selfHosted = read(".env.self-hosted.example");
  if (!selfHosted.includes("CITED_DATABASE_PROVIDER=postgres")) {
    addViolation(
      "self-hosted-db-provider-missing",
      ".env.self-hosted.example",
      "Self-hosted env example must document CITED_DATABASE_PROVIDER=postgres.",
    );
  }
  if (!selfHosted.includes("DATABASE_URL=")) {
    addViolation(
      "self-hosted-database-url-missing",
      ".env.self-hosted.example",
      "Self-hosted env example must document DATABASE_URL.",
    );
  }

  const envExample = read(".env.example");
  if (envExample.includes("CLERK_") || envExample.includes("STRIPE_") || envExample.includes("RESEND_")) {
    addViolation(
      "env-example-cloud-variables",
      ".env.example",
      "Community env example must not document Cloud-only variables.",
    );
  }
}

function checkSeedSafety() {
  const seed = read("supabase/seed.sql");
  const forbidden = [
    /@gmail\.com/i,
    /@yahoo\.com/i,
    /password/i,
    /sk_live_/,
    /service_role/i,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(seed)) {
      addViolation(
        "seed-sensitive-content",
        "supabase/seed.sql",
        "Seed file contains forbidden sensitive content pattern.",
      );
      break;
    }
  }
}

function checkConfigTomlSeedReference() {
  const config = read("supabase/config.toml");
  if (config.includes("./seed.sql") && !exists("supabase/seed.sql")) {
    addViolation(
      "supabase-missing-seed",
      "supabase/config.toml",
      "config.toml references a missing seed file.",
    );
  }
}

function checkMigrationNaming() {
  const dir = join(repoRoot, "supabase", "migrations");
  const files = readdirSync(dir).filter((name) => name.endsWith(".sql")).sort();
  const seen = new Set();
  for (const file of files) {
    const id = file.slice(0, 14);
    if (seen.has(id)) {
      addViolation("migration-duplicate-id", `supabase/migrations/${file}`, "Duplicate migration identifier.");
    }
    seen.add(id);
  }
}

function checkDestructiveResetSafeguards() {
  const resetScript = read("scripts/db-reset-local.mjs");
  const required = [
    "CITED_ALLOW_DB_RESET",
    "CITED_DEPLOYMENT_MODE",
    "isLocalDatabaseTarget",
    "confirmation",
  ];
  for (const token of required) {
    if (!resetScript.includes(token)) {
      addViolation(
        "db-reset-safeguard-missing",
        "scripts/db-reset-local.mjs",
        `Missing reset safeguard: ${token}`,
      );
    }
  }
}

function checkPostgresParameterizedQueries() {
  const source = read("lib/db/providers/postgres/query-builder.ts");
  if (!source.includes("pushParam")) {
    addViolation(
      "postgres-parameterization-missing",
      "lib/db/providers/postgres/query-builder.ts",
      "PostgreSQL provider must bind query parameters.",
    );
  }
}

function main() {
  checkRequiredFiles();
  checkNeutralCoreAvoidsSupabase();
  checkSupabaseImportsApproved();
  checkClientCannotImportDbProviders();
  checkEnvExamples();
  checkSeedSafety();
  checkConfigTomlSeedReference();
  checkMigrationNaming();
  checkDestructiveResetSafeguards();
  checkPostgresParameterizedQueries();

  if (violations.length > 0) {
    console.error("database-check: FAIL");
    for (const violation of violations) {
      console.error(`[${violation.ruleId}] ${violation.path}: ${violation.message}`);
    }
    process.exit(1);
  }

  console.log("database-check: PASS");
}

main();
