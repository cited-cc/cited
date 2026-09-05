#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

const APPROVED_ENV_READ_PATHS = [
  "lib/deployment/config.ts",
  "lib/deployment/mode.ts",
  "lib/providers/config.ts",
  "next.config.ts",
  "scripts/seo/generate-sitemap.ts",
  "scripts/db-seed.mjs",
  "scripts/db-reset-local.mjs",
];

const SCAN_IGNORE_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  "dist",
  "coverage",
]);

const CORE_MODULE_PREFIXES = [
  "lib/monitoring/",
  "lib/citations/",
  "lib/domains/",
  "lib/evidence/",
  "lib/export/",
  "lib/inbox/",
  "lib/notebook/",
];

const FORBIDDEN_CLOUD_ROUTES = [
  "app/api/billing/create-checkout/route.ts",
  "app/api/webhooks/stripe/route.ts",
  "app/api/scan/route.ts",
  "app/api/chatbot/chat/route.ts",
  "app/api/webhooks/clerk/route.ts",
  "app/api/webhooks/resend/route.ts",
  "app/api/internal/billing/reconcile/route.ts",
  "app/api/internal/scan/dispatch/route.ts",
  "app/api/internal/notifications/lifecycle/route.ts",
  "app/api/integrations/learn-domains/handoff/route.ts",
  "app/checkout/page.tsx",
  "app/app/billing/page.tsx",
];

const REQUIRED_DEPLOYMENT_FILES = [
  "lib/deployment/types.ts",
  "lib/deployment/config.ts",
  "lib/deployment/mode.ts",
  "lib/deployment/capabilities.ts",
  "lib/deployment/guards.ts",
  "lib/deployment/http-guards.ts",
  "lib/deployment/public-config.ts",
  "lib/deployment/index.ts",
  "docs/open-source/deployment-modes.md",
  "docs/open-source/distribution-boundary.md",
  ".env.self-hosted.example",
  "config/public-surface.json",
  "tests/deployment.test.ts",
  "tests/deployment-boundary-check.test.ts",
  "tests/public-surface-boundary.test.ts",
];

const REQUIRED_CAPABILITIES = [
  "monitoring",
  "citationClassification",
  "evidenceLedger",
  "inbox",
  "notebook",
  "domainVerification",
  "basicExport",
  "workspaceRoles",
  "internalSchedulerEndpoints",
  "selfHostedAuthentication",
  "selfHostedBootstrap",
  "selfHostedEntitlements",
  "selfHostedScheduler",
  "selfHostedDocker",
  "selfHostedNotifications",
  "portableDatabase",
  "deterministicMigrations",
  "databaseHealthChecks",
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

function checkRequiredFiles() {
  for (const filePath of REQUIRED_DEPLOYMENT_FILES) {
    if (!exists(filePath)) {
      addViolation("deployment-file-missing", filePath, "Required deployment artifact is missing.");
    }
  }
}

function checkEnvExamples() {
  for (const filePath of [".env.example", ".env.self-hosted.example"]) {
    if (!exists(filePath)) continue;
    const content = read(filePath);
    if (!content.includes("CITED_DEPLOYMENT_MODE")) {
      addViolation(
        "deployment-env-example-missing-mode",
        filePath,
        "Environment example must document CITED_DEPLOYMENT_MODE.",
      );
    }
  }
}

function checkDirectEnvReads() {
  const files = listFiles(".");
  for (const filePath of files) {
    if (filePath.startsWith("tests/")) continue;
    if (APPROVED_ENV_READ_PATHS.includes(filePath.replace(/\\/g, "/"))) {
      continue;
    }
    if (!exists(filePath)) continue;
    const content = read(filePath);
    if (/process\.env\.CITED_DEPLOYMENT_MODE/.test(content)) {
      addViolation(
        "deployment-env-read-outside-config",
        filePath,
        "CITED_DEPLOYMENT_MODE must only be read from lib/deployment/config.ts or mode resolution.",
      );
    }
  }
}

function checkClientImportsServerDeployment() {
  const clientCandidates = listFiles("components").concat(listFiles("app"));
  for (const filePath of clientCandidates) {
    if (!filePath.endsWith(".tsx") && !filePath.endsWith(".ts")) continue;
    const content = read(filePath);
    const isClient = content.includes('"use client"') || content.includes("'use client'");
    if (!isClient) continue;
    if (
      /from "@\/lib\/deployment\/(config|mode|capabilities|guards|status|errors)"/.test(
        content,
      )
    ) {
      addViolation(
        "deployment-client-imports-server-module",
        filePath,
        "Client components must not import server-only deployment modules.",
      );
    }
  }
}

function checkForbiddenCloudRoutes() {
  for (const route of FORBIDDEN_CLOUD_ROUTES) {
    if (exists(route)) {
      addViolation(
        "cloud-route-still-present",
        route,
        "Cloud-only route must not exist in community distribution.",
      );
    }
  }
}

function checkCoreModulesAvoidStripeImports() {
  for (const prefix of CORE_MODULE_PREFIXES) {
    const files = listFiles(prefix);
    for (const filePath of files) {
      const content = read(filePath);
      if (/from "@\/lib\/billing\/stripe"/.test(content)) {
        addViolation(
          "core-module-stripe-import",
          filePath,
          "Core modules must not import Stripe billing directly.",
        );
      }
    }
  }
}

function checkCapabilityRegistry() {
  if (!exists("lib/deployment/capabilities.ts")) return;
  const content = read("lib/deployment/capabilities.ts");
  for (const capability of REQUIRED_CAPABILITIES) {
    if (!content.includes(`${capability}:`)) {
      addViolation(
        "capability-registry-incomplete",
        "lib/deployment/capabilities.ts",
        `Capability registry missing ${capability}.`,
      );
    }
  }
}

function checkSensitiveExampleContent() {
  const examples = [".env.example", ".env.self-hosted.example"];
  const sensitivePatterns = [
    /sk_live_/,
    /sk_test_[A-Za-z0-9]{20,}/,
    /re_[A-Za-z0-9]{20,}/,
    /eyJ[A-Za-z0-9_-]{10,}\.eyJ/,
  ];
  for (const filePath of examples) {
    if (!exists(filePath)) continue;
    const content = read(filePath);
    for (const pattern of sensitivePatterns) {
      if (pattern.test(content)) {
        addViolation(
          "deployment-example-sensitive-content",
          filePath,
          "Environment example contains sensitive-looking placeholder content.",
        );
        break;
      }
    }
  }
}

function checkMonitoringDispatchStillAvailable() {
  const route = "app/api/internal/monitoring/dispatch/route.ts";
  if (!exists(route)) return;
  const content = read(route);
  if (/guardMarketingFreeScanRoute|guardStripeCheckoutRoute|guardCloudBillingRoute/.test(content)) {
    addViolation(
      "monitoring-dispatch-improperly-gated",
      route,
      "Monitoring dispatch must remain available in both deployment modes.",
    );
  }
}

function main() {
  checkRequiredFiles();
  checkEnvExamples();
  checkDirectEnvReads();
  checkClientImportsServerDeployment();
  checkForbiddenCloudRoutes();
  checkCoreModulesAvoidStripeImports();
  checkCapabilityRegistry();
  checkSensitiveExampleContent();
  checkMonitoringDispatchStillAvailable();

  if (violations.length > 0) {
    console.error(`deployment-check: FAIL (${violations.length} violations)`);
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

  console.log("deployment-check: PASS");
}

main();
