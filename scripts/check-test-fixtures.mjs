#!/usr/bin/env node
/**
 * Validates test fixtures and workflow files for synthetic privacy boundaries.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();
const findings = [];

const FORBIDDEN_EMAIL_DOMAINS = [
  /@gmail\.com/i,
  /@yahoo\.com/i,
  /@hotmail\.com/i,
  /@icloud\.com/i,
  /@[^@\s]+\.(?:io|dev|app)(?!\.)$/i,
];

const ALLOWED_TEST_DOMAINS = [
  "example.com",
  "example.org",
  "example.net",
  "cited-test.example",
  "competitor-labs.example",
  "personal-domain.test",
  "localhost",
];

const FIXTURE_ALLOWLIST = [
  "tests/publication-readiness.test.ts",
  "tests/secret-files.test.ts",
  "tests/phase13-security.test.ts",
  "tests/notifications.test.ts",
];

const FORBIDDEN_FIXTURE_PATTERNS = [
  /sk_live_[A-Za-z0-9]{16,}/,
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
  /postgresql:\/\/[^\s]+:\[redacted\]@/,
  /hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[a-zA-Z0-9]{20,}/,
];

function add(ruleId, path, message) {
  findings.push({ ruleId, path, message });
}

function walk(dir, visitor) {
  for (const entry of readdirSync(dir)) {
    const absolute = join(dir, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".git") continue;
      walk(absolute, visitor);
      continue;
    }
    visitor(absolute);
  }
}

function isAllowedTestEmail(email) {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return ALLOWED_TEST_DOMAINS.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`),
  );
}

function scanFile(relativePath) {
  let content;
  try {
    content = readFileSync(join(repoRoot, relativePath), "utf8");
  } catch {
    return;
  }

  const emailMatches = content.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi) ?? [];
  for (const email of emailMatches) {
    if (email.includes("example.com") || isAllowedTestEmail(email)) {
      continue;
    }
    for (const pattern of FORBIDDEN_EMAIL_DOMAINS) {
      if (pattern.test(email)) {
        add("fixture-real-email", relativePath, "Fixture contains a non-reserved email domain.");
        break;
      }
    }
  }

  if (
    (relativePath.startsWith("tests/") || relativePath.startsWith(".github/")) &&
    !FIXTURE_ALLOWLIST.includes(relativePath)
  ) {
    for (const pattern of FORBIDDEN_FIXTURE_PATTERNS) {
      if (pattern.test(content)) {
        add("fixture-sensitive-pattern", relativePath, "Fixture contains a sensitive-looking pattern.");
        break;
      }
    }
  }

  if (/test-results|playwright-report|trace\.zip/.test(relativePath)) {
    add("committed-artifact", relativePath, "Browser test artifacts must not be committed.");
  }
}

function main() {
  for (const root of ["tests", ".github/workflows"]) {
    const absolute = join(repoRoot, root);
    try {
      statSync(absolute);
    } catch {
      continue;
    }
    walk(absolute, (filePath) => {
      const relative = filePath.replace(`${repoRoot}/`, "");
      if (!/\.(ts|tsx|js|mjs|json|yml|yaml|md)$/.test(relative)) {
        return;
      }
      scanFile(relative);
    });
  }

  if (findings.length > 0) {
    console.error("test-fixtures:check: FAIL");
    for (const finding of findings) {
      console.error(JSON.stringify({ level: "error", ...finding }));
    }
    process.exit(1);
  }

  console.log("test-fixtures:check: PASS");
}

main();
