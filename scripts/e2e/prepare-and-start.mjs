#!/usr/bin/env node
/**
 * Prepare E2E database/secrets and start the production server for Playwright.
 */
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

import {
  createSyntheticDatabase,
  dropSyntheticDatabase,
} from "../../tests/helpers/postgres-ci.mjs";

const repoRoot = process.cwd();
const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const localBin = join(repoRoot, "node_modules", ".bin");
const pathEnv = `${localBin}:${process.env.PATH ?? ""}`;

function deriveAdminUrl(databaseUrl) {
  const url = new URL(databaseUrl);
  url.pathname = "/postgres";
  return url.toString();
}

function deriveDatabaseName(databaseUrl) {
  return new URL(databaseUrl).pathname.replace(/^\//, "") || "postgres";
}

async function runCommand(command, args, env = process.env) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

async function main() {
  const databaseUrl =
    process.env.CITED_E2E_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("CITED_E2E_DATABASE_URL or DATABASE_URL is required for E2E.");
  }

  const authSecret =
    process.env.AUTH_SECRET ?? randomBytes(32).toString("hex");
  const bootstrapToken =
    process.env.CITED_BOOTSTRAP_TOKEN ?? randomBytes(24).toString("hex");
  const cronSecret =
    process.env.MONITORING_CRON_SECRET ?? randomBytes(24).toString("hex");
  const slackKey =
    process.env.SLACK_WEBHOOK_ENCRYPTION_KEY ?? randomBytes(32).toString("hex");

  const stateDir = join(repoRoot, ".cited", "e2e");
  mkdirSync(stateDir, { recursive: true });

  writeFileSync(
    join(stateDir, "state.json"),
    JSON.stringify(
      {
        bootstrapToken,
        ownerEmail: "owner.e2e@example.com",
        ownerPassword: "e2e-owner-password-12",
        workspaceName: "E2E Workspace",
      },
      null,
      2,
    ),
    "utf8",
  );

  const runtimeEnv = {
    TZ: "UTC",
    NODE_ENV: "production",
    AUTH_SECRET: authSecret,
    CITED_BOOTSTRAP_TOKEN: bootstrapToken,
    MONITORING_CRON_SECRET: cronSecret,
    SLACK_WEBHOOK_ENCRYPTION_KEY: slackKey,
    DATABASE_URL: databaseUrl,
    DATABASE_MIGRATION_URL: databaseUrl,
    NEXT_PUBLIC_APP_URL:
      process.env.CITED_E2E_BASE_URL ?? "http://127.0.0.1:3000",
    CITED_DEPLOYMENT_MODE: "self_hosted",
    NEXT_PUBLIC_CITED_DEPLOYMENT_MODE: "self_hosted",
    CITED_AUTH_PROVIDER: "local",
    NEXT_PUBLIC_CITED_AUTH_PROVIDER: "local",
    CITED_DATABASE_PROVIDER: "postgres",
    CITED_MONITORING_PROVIDER: "mock",
    CITED_ALLOW_MOCK_PROVIDER: "true",
    NOTIFICATIONS_ENABLED: "false",
    CITED_EMAIL_PROVIDER: "disabled",
    MONITORING_ENABLED: "true",
  };

  writeFileSync(
    join(stateDir, "runtime.env.json"),
    `${JSON.stringify(runtimeEnv, null, 2)}\n`,
    "utf8",
  );

  const runtimeEnvWithPath = { ...runtimeEnv, PATH: pathEnv };

  const adminUrl = deriveAdminUrl(databaseUrl);
  const databaseName = deriveDatabaseName(databaseUrl);
  await dropSyntheticDatabase(adminUrl, databaseName).catch(() => undefined);
  await createSyntheticDatabase(adminUrl, databaseName);

  await runCommand(process.execPath, ["scripts/db-migrate.mjs"], runtimeEnvWithPath);

  const { Pool } = await import("pg");
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const pool = new Pool({ connectionString: databaseUrl });
    try {
      await pool.query("SELECT 1");
      await pool.end();
      break;
    } catch {
      await pool.end().catch(() => undefined);
      if (attempt === 29) {
        throw new Error("E2E database did not become ready.");
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  const worker = spawn("npm", ["run", "jobs:worker"], {
    cwd: repoRoot,
    env: { ...runtimeEnvWithPath, CITED_JOBS_WORKER_TICK_MS: "5000" },
    stdio: "ignore",
    detached: true,
    shell: true,
  });
  writeFileSync(join(stateDir, "worker.pid"), `${worker.pid ?? ""}\n`, "utf8");

  const server = spawn(process.execPath, [nextBin, "start"], {
    cwd: repoRoot,
    env: runtimeEnvWithPath,
    stdio: "inherit",
  });

  server.on("exit", (code) => process.exit(code ?? 1));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "E2E server failed");
  process.exit(1);
});
