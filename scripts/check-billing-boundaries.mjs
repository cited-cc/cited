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

const FORBIDDEN_CLOUD_BILLING_PATHS = [
  "lib/billing/",
  "lib/entitlements/providers/cloud.ts",
  "app/api/billing/",
  "app/api/webhooks/stripe/",
  "app/api/internal/billing/",
  "app/checkout/",
  "app/app/billing/",
  "components/billing/",
];

const REQUIRED_ENTITLEMENT_FILES = [
  "lib/entitlements/types.ts",
  "lib/entitlements/provider.ts",
  "lib/entitlements/factory.ts",
  "lib/entitlements/resolve.ts",
  "lib/entitlements/providers/self-hosted.ts",
  "lib/entitlements/index.ts",
  "scripts/check-billing-boundaries.mjs",
  "docs/open-source/entitlements.md",
  "tests/entitlements-phase6.test.ts",
  "tests/billing-boundary-check.test.ts",
];

/** @typedef {{ ruleId: string; path: string; message: string }} Violation */

/** @type {Violation[]} */
const violations = [];

function addViolation(ruleId, path, message) {
  violations.push({ ruleId, path, message });
}

function read(path) {
  return readFileSync(join(repoRoot, path), "utf8");
}

function exists(path) {
  try {
    statSync(join(repoRoot, path));
    return true;
  } catch {
    return false;
  }
}

function listFiles(dir, acc = []) {
  const absolute = join(repoRoot, dir);
  if (!exists(dir)) return acc;
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    if (SCAN_IGNORE_DIRS.has(entry.name)) continue;
    const rel = join(dir, entry.name);
    if (entry.isDirectory()) {
      listFiles(rel, acc);
    } else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
      acc.push(rel);
    }
  }
  return acc;
}

function checkRequiredEntitlementFiles() {
  for (const filePath of REQUIRED_ENTITLEMENT_FILES) {
    if (!exists(filePath)) {
      addViolation("entitlement-file-missing", filePath, "Required entitlement artifact is missing.");
    }
  }
}

function checkForbiddenCloudBillingArtifacts() {
  for (const filePath of FORBIDDEN_CLOUD_BILLING_PATHS) {
    if (exists(filePath)) {
      addViolation(
        "cloud-billing-artifact-present",
        filePath,
        "Cloud billing implementation must not exist in community distribution.",
      );
    }
  }
}

function checkNeutralCoreAvoidsStripe() {
  for (const prefix of NEUTRAL_CORE_PREFIXES) {
    const files = listFiles(prefix);
    for (const filePath of files) {
      const content = read(filePath);
      if (/from "@\/lib\/billing\//.test(content) || /from ['"]stripe['"]/.test(content)) {
        addViolation(
          "neutral-core-stripe-import",
          filePath,
          "Neutral core modules must not import Stripe billing.",
        );
      }
      if (/Upgrade to/i.test(content) || /from billing/i.test(content) || /\/checkout/i.test(content)) {
        addViolation(
          "checkout-upgrade-language",
          filePath,
          "Upgrade/checkout language must not remain in neutral core modules.",
        );
      }
    }
  }
}

function checkSelfHostedProviderAvoidsStripe() {
  const filePath = "lib/entitlements/providers/self-hosted.ts";
  if (!exists(filePath)) return;
  const content = read(filePath);
  if (/stripe/i.test(content)) {
    addViolation(
      "self-hosted-provider-stripe-reference",
      filePath,
      "Self-hosted entitlement provider must not reference Stripe.",
    );
  }
}

function checkMonitoringAvoidsPaidLanguage() {
  const monitoringFiles = listFiles("lib/monitoring/");
  for (const filePath of monitoringFiles) {
    const content = read(filePath);
    if (/canRunPaidMonitoring/.test(content)) {
      addViolation(
        "monitoring-paid-language",
        filePath,
        "Core monitoring must use neutral canRunMonitoring checks, not canRunPaidMonitoring.",
      );
    }
  }
}

function checkSelfHostedEnvExample() {
  const filePath = ".env.self-hosted.example";
  if (!exists(filePath)) return;
  const content = read(filePath);
  if (/STRIPE_/.test(content)) {
    addViolation(
      "self-hosted-env-stripe-variable",
      filePath,
      "Self-hosted environment example must not document Stripe variables.",
    );
  }
  if (/RESEND_/.test(content)) {
    addViolation(
      "self-hosted-env-resend-variable",
      filePath,
      "Self-hosted environment example must not document Resend variables.",
    );
  }
  if (!content.includes("CITED_SELF_HOSTED_MAX_DOMAINS")) {
    addViolation(
      "self-hosted-env-limits-missing",
      filePath,
      "Self-hosted environment example must document operational limit variables.",
    );
  }
}

function checkEntitlementFactoryCommunityOnly() {
  if (!exists("lib/entitlements/factory.ts")) return;
  const content = read("lib/entitlements/factory.ts");
  if (!content.includes("self_hosted")) {
    addViolation(
      "entitlement-factory-incomplete",
      "lib/entitlements/factory.ts",
      "Entitlement factory must register self-hosted provider.",
    );
  }
  if (/cloudEntitlementProvider|getEntitlementProvider\("stripe"\)/.test(content)) {
    addViolation(
      "entitlement-factory-cloud-reference",
      "lib/entitlements/factory.ts",
      "Entitlement factory must not reference cloud Stripe provider.",
    );
  }
}

function checkPackageJsonAvoidsStripe() {
  const pkg = JSON.parse(read("package.json"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps.stripe) {
    addViolation("stripe-dependency-present", "package.json", "Stripe dependency must be removed.");
  }
}

function main() {
  checkRequiredEntitlementFiles();
  checkForbiddenCloudBillingArtifacts();
  checkNeutralCoreAvoidsStripe();
  checkSelfHostedProviderAvoidsStripe();
  checkMonitoringAvoidsPaidLanguage();
  checkSelfHostedEnvExample();
  checkEntitlementFactoryCommunityOnly();
  checkPackageJsonAvoidsStripe();

  if (violations.length > 0) {
    console.error(`billing-check: FAIL (${violations.length} violations)`);
    for (const violation of violations) {
      console.error(
        JSON.stringify({
          level: "error",
          ruleId: violation.ruleId,
          path: violation.path,
          message: violation.message,
        }),
      );
    }
    process.exit(1);
  }

  console.log("billing-check: PASS");
}

main();
