#!/usr/bin/env node

import { spawnSync } from "node:child_process";

import {
  TARGET_TAG,
  TARGET_VERSION,
  collectReleaseViolations,
  getGitStatus,
} from "../lib/release/release.mjs";

const repoRoot = process.cwd();
const mode = process.env.CITED_RELEASE_MODE === "release" ? "release" : "candidate";

const CI_STAGES = [
  "workflow:check",
  "docs:check",
  "readme:check",
  "assets:check",
  "docs:links",
  "test:all",
  "test:coverage",
  "security:scan",
  "security:check",
  "security:audit",
  "license:check",
  "sbom:generate",
  "public-surface:check",
  "docker:check",
  "scheduler:check",
  "notifications:check",
  "monitoring:check",
  "provider:check",
  "database:check",
  "auth:check",
  "deployment:check",
  "lint",
  "typecheck",
  "test",
  "content:check",
  "seo:check",
  "build",
  "db:migration-ci",
  "test:e2e",
  "self-host:smoke",
];

const E2E_CI_ENV = {
  CITED_E2E_ENABLED: "true",
  CITED_E2E_DATABASE_URL:
    process.env.CITED_E2E_DATABASE_URL?.trim() ||
    process.env.CITED_INTEGRATION_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    "postgresql://postgres:ci_fake_password_not_production_scope@localhost:5432/cited_ci_e2e",
  DATABASE_URL:
    process.env.CITED_E2E_DATABASE_URL?.trim() ||
    process.env.CITED_INTEGRATION_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    "postgresql://postgres:ci_fake_password_not_production_scope@localhost:5432/cited_ci_e2e",
  AUTH_SECRET: "ci_e2e_auth_secret_min_32_chars_long_value",
  CITED_BOOTSTRAP_TOKEN: "ci_e2e_bootstrap_token_value_32chars",
  MONITORING_CRON_SECRET: "ci_e2e_monitoring_cron_secret_value",
  SLACK_WEBHOOK_ENCRYPTION_KEY: "ci_e2e_slack_encryption_key_32chars",
  CITED_DEPLOYMENT_MODE: "self_hosted",
  NEXT_PUBLIC_CITED_DEPLOYMENT_MODE: "self_hosted",
  CITED_AUTH_PROVIDER: "local",
  NEXT_PUBLIC_CITED_AUTH_PROVIDER: "local",
  CITED_DATABASE_PROVIDER: "postgres",
  CITED_MONITORING_PROVIDER: "mock",
  CITED_ALLOW_MOCK_PROVIDER: "true",
  NOTIFICATIONS_ENABLED: "false",
  CITED_EMAIL_PROVIDER: "disabled",
};

/** @type {{ ruleId: string; message: string; path: string }[]} */
const violations = [];

/** @type {string | null} */
let releasePostgresAdminUrl = null;

function ensureReleasePostgres() {
  const result = spawnSync("node", ["scripts/release-postgres.mjs", "ensure"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, TZ: "UTC", FORCE_COLOR: "0" },
  });

  if (result.status !== 0) {
    violations.push({
      ruleId: "release-postgres-unavailable",
      path: "scripts/release-postgres.mjs",
      message: "PostgreSQL is required for release gates but could not be started.",
    });
    if (result.stderr) process.stderr.write(result.stderr);
    return null;
  }

  const lines = result.stdout.trim().split("\n");
  const adminUrl = lines[lines.length - 1]?.trim();
  if (!adminUrl?.startsWith("postgresql://")) {
    violations.push({
      ruleId: "release-postgres-url-missing",
      path: "scripts/release-postgres.mjs",
      message: "Could not resolve PostgreSQL admin URL for release gates.",
    });
    return null;
  }

  for (const line of lines) {
    if (!line.startsWith("{")) continue;
    try {
      const payload = JSON.parse(line);
      if (payload.container) {
        process.env.CITED_RELEASE_POSTGRES_CONTAINER = payload.container;
      }
    } catch {
      // Ignore non-JSON lines.
    }
  }

  releasePostgresAdminUrl = adminUrl;
  process.env.CITED_RELEASE_POSTGRES_ADMIN_URL = adminUrl;
  const e2eDatabaseUrl = adminUrl.replace(/\/postgres$/, "/cited_ci_e2e");
  Object.assign(E2E_CI_ENV, {
    CITED_MIGRATION_CI_ADMIN_URL: adminUrl,
    CITED_INTEGRATION_DATABASE_URL: e2eDatabaseUrl,
    CITED_E2E_DATABASE_URL: e2eDatabaseUrl,
    DATABASE_URL: e2eDatabaseUrl,
  });
  console.log("[PASS] release-postgres");
  return adminUrl;
}

function stopReleasePostgres() {
  spawnSync("node", ["scripts/release-postgres.mjs", "stop"], {
    cwd: repoRoot,
    stdio: "ignore",
    env: {
      ...process.env,
      CITED_RELEASE_POSTGRES_CONTAINER: process.env.CITED_RELEASE_POSTGRES_CONTAINER,
      CITED_RELEASE_POSTGRES_ADMIN_URL: releasePostgresAdminUrl ?? process.env.CITED_RELEASE_POSTGRES_ADMIN_URL,
    },
  });
}

function runStage(scriptName, extraEnv = {}) {
  const result = spawnSync("npm", ["run", scriptName], {
    cwd: repoRoot,
    env: { ...process.env, TZ: "UTC", FORCE_COLOR: "0", ...extraEnv },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    violations.push({
      ruleId: "ci-stage-failed",
      path: "package.json",
      message: `Required release gate "${scriptName}" failed.`,
    });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  } else {
    console.log(`[PASS] ${scriptName}`);
  }
}

function main() {
  console.error(`release:check starting (mode=${mode}, version=${TARGET_VERSION}, tag=${TARGET_TAG})`);

  const status = getGitStatus(repoRoot);
  console.error(
    JSON.stringify({
      level: "info",
      branch: status.branch,
      head: status.head,
      commitCount: status.commitCount,
      remotes: status.remotes,
      tags: status.tags,
      dirty: status.dirty,
    }),
  );

  for (const stage of CI_STAGES) {
    if (stage === "db:migration-ci" || stage === "test:e2e") {
      if (!releasePostgresAdminUrl) {
        ensureReleasePostgres();
      }
      if (violations.some((v) => v.ruleId.startsWith("release-postgres"))) {
        break;
      }
    }

    if (stage === "test:e2e") {
      runStage(stage, E2E_CI_ENV);
    } else if (stage === "db:migration-ci") {
      runStage(stage, {
        CITED_MIGRATION_CI_ADMIN_URL: releasePostgresAdminUrl ?? E2E_CI_ENV.CITED_E2E_DATABASE_URL,
      });
    } else {
      runStage(stage);
    }
  }

  stopReleasePostgres();

  violations.push(...collectReleaseViolations(repoRoot, { mode }));

  const diffCheck = spawnSync("git", ["diff", "--check"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (diffCheck.status !== 0) {
    violations.push({
      ruleId: "whitespace-errors",
      path: ".",
      message: "git diff --check reported whitespace errors.",
    });
  }

  if (status.dirty) {
    console.error("git status --short:");
    console.error(status.porcelain);
  }

  if (violations.length > 0) {
    console.error(`release:check: FAIL (${violations.length} violations)`);
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

  console.error("release:check: PASS");
}

main();
