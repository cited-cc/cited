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

const NEUTRAL_AUTH_PREFIXES = [
  "lib/auth/types.ts",
  "lib/auth/config.ts",
  "lib/auth/password.ts",
  "lib/auth/identity.ts",
  "lib/auth/principal.ts",
  "lib/auth/provider.ts",
  "lib/auth/factory.ts",
  "lib/auth/session.ts",
  "lib/auth/guards.ts",
  "lib/auth/membership-keys.ts",
  "lib/auth/local-credentials.ts",
  "lib/auth/bootstrap.ts",
  "lib/auth/invitations.ts",
  "lib/auth/index.ts",
  "lib/auth/access-state.ts",
  "lib/auth/errors.ts",
  "lib/auth/permissions.ts",
  "lib/auth/redirects.ts",
  "lib/auth/actions.ts",
  "lib/auth/public-config.ts",
];

const FORBIDDEN_CLERK_PATHS = [
  "lib/auth/providers/clerk.ts",
  "lib/auth/clerk-errors.ts",
  "components/auth/cited-clerk-provider.tsx",
  "components/auth/clerk-captcha.tsx",
  "app/api/webhooks/clerk/",
];

const REQUIRED_AUTH_FILES = [
  "lib/auth/types.ts",
  "lib/auth/config.ts",
  "lib/auth/password.ts",
  "lib/auth/provider.ts",
  "lib/auth/factory.ts",
  "lib/auth/providers/local.ts",
  "lib/auth/bootstrap.ts",
  "auth.ts",
  "app/api/auth/[...nextauth]/route.ts",
  "docs/open-source/authentication.md",
  "scripts/check-auth-boundaries.mjs",
  "tests/auth.test.ts",
  "tests/auth-boundary-check.test.ts",
  "supabase/migrations/20260731140000_cited_phase5_canonical_identities.sql",
];

const findings = [];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (SCAN_IGNORE_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
    } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

function relativePath(fullPath) {
  return fullPath.startsWith(repoRoot + "/")
    ? fullPath.slice(repoRoot.length + 1)
    : fullPath;
}

function exists(relPath) {
  try {
    statSync(join(repoRoot, relPath));
    return true;
  } catch {
    return false;
  }
}

function isNeutralAuthFile(relPath) {
  return NEUTRAL_AUTH_PREFIXES.some(
    (prefix) => relPath === prefix || relPath.startsWith(prefix),
  );
}

for (const rel of REQUIRED_AUTH_FILES) {
  if (!exists(rel)) {
    findings.push(`missing required auth file: ${rel}`);
  }
}

for (const rel of FORBIDDEN_CLERK_PATHS) {
  if (exists(rel)) {
    findings.push(`forbidden Clerk artifact present: ${rel}`);
  }
}

for (const rel of ["lib/auth/index.ts", "lib/auth/access-state.ts", "lib/auth/config.ts"]) {
  const content = readFileSync(join(repoRoot, rel), "utf8");
  if (content.includes("@clerk/")) {
    findings.push(`direct Clerk import in neutral module: ${rel}`);
  }
  if (/\bclerk\b/i.test(content) && !content.includes("clerk_user_id")) {
    if (content.includes('"clerk"') || content.includes("'clerk'")) {
      findings.push(`Clerk provider reference in neutral module: ${rel}`);
    }
  }
}

for (const file of walk(repoRoot)) {
  const rel = relativePath(file);
  if (!isNeutralAuthFile(rel)) continue;
  const content = readFileSync(file, "utf8");
  if (content.includes("@clerk/")) {
    findings.push(`direct Clerk import in neutral auth module: ${rel}`);
  }
}

for (const file of walk(join(repoRoot, "lib/auth"))) {
  const rel = relativePath(file);
  const content = readFileSync(file, "utf8");
  if (content.includes("@clerk/")) {
    findings.push(`unexpected Clerk import: ${rel}`);
  }
}

for (const file of walk(join(repoRoot, "components"))) {
  if (!file.endsWith(".tsx")) continue;
  const content = readFileSync(file, "utf8");
  if (content.includes("@clerk/")) {
    findings.push(`Clerk import in component: ${relativePath(file)}`);
  }
}

const envExample = readFileSync(
  join(repoRoot, ".env.self-hosted.example"),
  "utf8",
);
for (const key of [
  "CITED_AUTH_PROVIDER",
  "AUTH_SECRET",
  "CITED_BOOTSTRAP_TOKEN",
]) {
  if (!envExample.includes(key)) {
    findings.push(`missing ${key} in .env.self-hosted.example`);
  }
}

if (/CLERK_/.test(envExample) || /NEXT_PUBLIC_CLERK_/.test(envExample)) {
  findings.push("Clerk variables must not appear in .env.self-hosted.example");
}

const migration = readFileSync(
  join(
    repoRoot,
    "supabase/migrations/20260731140000_cited_phase5_canonical_identities.sql",
  ),
  "utf8",
);
if (/password\s+text/i.test(migration) && !/password_hash/i.test(migration)) {
  findings.push("migration may store plaintext passwords");
}

for (const file of walk(join(repoRoot, "components"))) {
  if (!file.endsWith(".tsx")) continue;
  const content = readFileSync(file, "utf8");
  if (content.includes("AUTH_SECRET") || content.includes("CITED_BOOTSTRAP_TOKEN")) {
    findings.push(`client component references auth secret: ${relativePath(file)}`);
  }
}

const authConfig = readFileSync(join(repoRoot, "lib/auth/config.ts"), "utf8");
if (!authConfig.includes('"local"')) {
  findings.push("auth config must resolve local provider for community edition");
}

if (findings.length > 0) {
  console.error("auth-check: FAIL");
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exit(1);
}

console.log("auth-check: PASS");
