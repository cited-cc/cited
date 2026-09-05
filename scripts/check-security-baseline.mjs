#!/usr/bin/env node
/**
 * Offline security baseline checker. Non-mutating. Fails closed.
 * Reports only rule IDs, categories, and paths. Never prints secrets.
 */
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();
const findings = [];

function add(ruleId, category, path, message) {
  findings.push({ ruleId, category, path, message });
}

function exists(rel) {
  try {
    statSync(join(repoRoot, rel));
    return true;
  } catch {
    return false;
  }
}

function read(rel) {
  return readFileSync(join(repoRoot, rel), "utf8");
}

function loadBaseline() {
  const path = "config/security-baseline.json";
  if (!exists(path)) {
    add("baseline-missing", "policy", path, "Security baseline policy is missing.");
    return null;
  }
  try {
    return JSON.parse(read(path));
  } catch {
    add("baseline-invalid", "policy", path, "Security baseline policy is malformed.");
    return null;
  }
}

function validateBaselineShape(baseline) {
  if (!baseline || typeof baseline !== "object") {
    add("baseline-shape", "policy", "config/security-baseline.json", "Baseline must be an object.");
    return;
  }
  if (!Array.isArray(baseline.requiredFiles)) {
    add("baseline-required-files", "policy", "config/security-baseline.json", "requiredFiles must be an array.");
  }
  if (!baseline.egressAllowlist?.inventoryModule) {
    add("baseline-egress", "egress", "config/security-baseline.json", "egressAllowlist.inventoryModule is required.");
  }
}

function checkRequiredFiles(baseline) {
  for (const file of baseline?.requiredFiles ?? []) {
    if (!exists(file)) {
      add("required-file-missing", "files", file, "Required security file is missing.");
    }
  }
}

function checkRequiredScripts(baseline, packageJson) {
  const scripts = baseline?.requiredScripts ?? {};
  for (const [scriptName, expectedPath] of Object.entries(scripts)) {
    if (!packageJson.scripts?.[scriptName]) {
      add("script-missing", "scripts", "package.json", `npm script "${scriptName}" is required.`);
    }
    if (expectedPath && !exists(expectedPath)) {
      add("script-target-missing", "scripts", expectedPath, `Script target for "${scriptName}" is missing.`);
    }
  }
}

function checkForbiddenPatterns(baseline) {
  for (const rule of baseline?.forbiddenPatterns ?? []) {
    if (rule.path && exists(rule.path)) {
      try {
        const content = read(rule.path);
        if (new RegExp(rule.pattern).test(content)) {
          add(rule.id, "pattern", rule.path, rule.reason ?? "Forbidden pattern detected.");
        }
      } catch {
        // skip unreadable paths
      }
    }
  }
}

function checkSelfHostedCsp() {
  const headers = read("lib/security/headers.ts");
  if (!headers.includes("buildSelfHostedContentSecurityPolicy")) {
    add("csp-self-hosted-builder", "headers", "lib/security/headers.ts", "Self-hosted CSP builder is required.");
  }
  if (/unsafe-eval/.test(headers)) {
    add("csp-unsafe-eval", "headers", "lib/security/headers.ts", "CSP must not include unsafe-eval.");
  }
}

function checkAuthModule() {
  const password = read("lib/auth/password.ts");
  if (!password.includes("scrypt-v1")) {
    add("password-hash-version", "authentication", "lib/auth/password.ts", "Versioned password hashing required.");
  }
  if (!password.includes("timingSafeEqual")) {
    add("password-timing-safe", "authentication", "lib/auth/password.ts", "Constant-time password verification required.");
  }

  const authConfig = read("lib/auth/auth.config.ts");
  if (!authConfig.includes("httpOnly: true")) {
    add("cookie-httponly", "sessions", "lib/auth/auth.config.ts", "Session cookies must be HttpOnly.");
  }
  if (!authConfig.includes('sameSite: "lax"')) {
    add("cookie-samesite", "sessions", "lib/auth/auth.config.ts", "Session cookies must use SameSite=lax.");
  }
  if (!authConfig.includes("isSessionStillValid")) {
    add("session-invalidation", "sessions", "lib/auth/auth.config.ts", "Session invalidation on credential change required.");
  }
  if (!exists("lib/auth/session-validation.ts")) {
    add("session-validation-module", "sessions", "lib/auth/session-validation.ts", "Session validation module is required.");
  }
}

function checkEgressModule() {
  const path = "lib/security/egress.ts";
  if (!exists(path)) {
    add("egress-module-missing", "egress", path, "Centralized egress module is required.");
    return;
  }
  const content = read(path);
  if (!content.includes("RUNTIME_EGRESS_INVENTORY")) {
    add("egress-inventory", "egress", path, "Runtime egress inventory is required.");
  }
  if (!content.includes("hooks.slack.com")) {
    add("egress-slack-host", "egress", path, "Slack host must be allowlisted.");
  }
  if (!content.includes("api.dataforseo.com")) {
    add("egress-dataforseo-host", "egress", path, "DataForSEO host must be allowlisted.");
  }
}

function checkRetentionModule() {
  const path = "lib/security/retention.ts";
  if (!exists(path)) {
    add("retention-module-missing", "retention", path, "Retention module is required.");
    return;
  }
  const content = read(path);
  if (!content.includes("dryRun")) {
    add("retention-dry-run", "retention", path, "Retention dry-run support is required.");
  }
}

function checkExportSanitization() {
  const csv = read("lib/export/csv.ts");
  if (!csv.includes("FORMULA_PREFIX")) {
    add("export-csv-formula", "exports", "lib/export/csv.ts", "CSV formula injection guard required.");
  }
}

function checkLogRedaction() {
  const logger = read("lib/security/logger.ts");
  if (!logger.includes("redactObject")) {
    add("log-redaction", "logging", "lib/security/logger.ts", "Recursive log redaction required.");
  }
}

function readTextIfFile(rel) {
  try {
    const full = join(repoRoot, rel);
    const stat = statSync(full);
    if (!stat.isFile()) return null;
    return readFileSync(full, "utf8");
  } catch {
    return null;
  }
}

function checkNoCallHome() {
  const egress = readTextIfFile("lib/security/egress.ts") ?? "";
  if (/cited\.cc/.test(egress) && egress.includes("fetch")) {
    add("call-home-telemetry", "egress", "lib/security/egress.ts", "Runtime must not call cited.cc automatically.");
  }
  for (const path of ["lib/seo/indexnow.ts"]) {
    const content = readTextIfFile(path);
    if (!content) continue;
    if (/fetch\([^)]*cited\.cc/.test(content)) {
      add("call-home-fetch", "egress", path, "Automatic cited.cc fetch is forbidden.");
    }
  }
}

function checkDockerHardening() {
  const dockerfile = read("Dockerfile");
  if (!dockerfile.includes("USER cited")) {
    add("docker-non-root", "container", "Dockerfile", "Runtime must use non-root user.");
  }
  const compose = read("docker-compose.yml");
  if (!compose.includes("cap_drop")) {
    add("docker-cap-drop", "container", "docker-compose.yml", "cap_drop is required.");
  }
  if (!compose.includes("no-new-privileges")) {
    add("docker-no-new-privileges", "container", "docker-compose.yml", "no-new-privileges is required.");
  }
}

function checkSecurityDocumentation() {
  for (const doc of [
    "docs/security/threat-model.md",
    "docs/security/privacy-and-data.md",
    "docs/security/hardening.md",
    "docs/security/release-checklist.md",
  ]) {
    if (!exists(doc)) {
      add("security-doc-missing", "documentation", doc, "Required security documentation is missing.");
    }
  }
}

function checkGitignoreSecrets() {
  const gitignore = read(".gitignore");
  if (!gitignore.includes(".cited")) {
    add("gitignore-secrets", "secret-handling", ".gitignore", ".cited/ must be gitignored.");
  }
}

function main() {
  const baseline = loadBaseline();
  validateBaselineShape(baseline);

  let packageJson = { scripts: {} };
  try {
    packageJson = JSON.parse(read("package.json"));
  } catch {
    add("package-json-invalid", "scripts", "package.json", "Could not parse package.json.");
  }

  if (baseline) {
    checkRequiredFiles(baseline);
    checkRequiredScripts(baseline, packageJson);
    checkForbiddenPatterns(baseline);
  }

  checkSelfHostedCsp();
  checkAuthModule();
  checkEgressModule();
  checkRetentionModule();
  checkExportSanitization();
  checkLogRedaction();
  checkNoCallHome();
  checkDockerHardening();
  checkSecurityDocumentation();
  checkGitignoreSecrets();

  if (findings.length > 0) {
    console.error("security-check: FAIL");
    for (const finding of findings) {
      console.error(
        JSON.stringify({
          level: "error",
          ruleId: finding.ruleId,
          category: finding.category,
          path: finding.path,
          message: finding.message,
        }),
      );
    }
    process.exit(1);
  }

  console.log("security-check: PASS");
}

main();
