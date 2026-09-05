#!/usr/bin/env tsx
/**
 * Lightweight secret scan for obvious credential patterns in source files.
 * Prints file path and redacted pattern only. Never prints matched secret values.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

const IGNORE_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  "coverage",
  "dist",
  ".turbo",
  ".vercel",
]);

const IGNORE_FILES = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
]);

const PATTERNS: { name: string; regex: RegExp }[] = [
  { name: "stripe_live_secret", regex: /sk_live_[A-Za-z0-9]{16,}/g },
  { name: "stripe_test_secret", regex: /sk_test_[A-Za-z0-9]{16,}/g },
  { name: "clerk_secret", regex: /sk_live_[A-Za-z0-9]{20,}|sk_test_[A-Za-z0-9]{20,}/g },
  {
    name: "supabase_service_role_jwt",
    regex: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  },
  { name: "slack_webhook", regex: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/_-]+/g },
  { name: "resend_api_key", regex: /re_[A-Za-z0-9]{20,}/g },
  { name: "private_key_block", regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g },
  {
    name: "aws_access_key",
    regex: /AKIA[0-9A-Z]{16}/g,
  },
];

const ALLOWLIST_PATH_FRAGMENTS = [
  "scripts/security/secret-scan.ts",
  "tests/",
  ".env.example",
];

function shouldScan(filePath: string): boolean {
  const rel = relative(ROOT, filePath);
  if (ALLOWLIST_PATH_FRAGMENTS.some((fragment) => rel.includes(fragment))) {
    return false;
  }
  if (IGNORE_FILES.has(rel.split("/").pop() ?? "")) {
    return false;
  }
  return /\.(ts|tsx|js|jsx|mjs|cjs|json|md|yml|yaml|toml|txt)$/.test(filePath);
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
    } else if (stat.isFile() && shouldScan(full)) {
      files.push(full);
    }
  }
  return files;
}

function main(): void {
  const files = walk(ROOT);
  let findings = 0;

  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const rel = relative(ROOT, file);
    for (const pattern of PATTERNS) {
      const matches = content.match(pattern.regex);
      if (!matches?.length) continue;
      findings += matches.length;
      console.error(
        JSON.stringify({
          level: "error",
          event: "secret_scan_finding",
          file: rel,
          pattern: pattern.name,
          count: matches.length,
          sample: "[REDACTED]",
        }),
      );
    }
  }

  if (findings > 0) {
    console.error(`secret-scan: ${findings} potential secret pattern(s) found.`);
    process.exit(1);
  }

  console.log("secret-scan: no obvious secret patterns found.");
}

main();
