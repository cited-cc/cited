#!/usr/bin/env node
/**
 * Start the production server for Playwright E2E with secrets from global-setup.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const repoRoot = process.cwd();
const runtimeEnvPath = join(repoRoot, ".cited", "e2e", "runtime.env.json");

if (!existsSync(runtimeEnvPath)) {
  console.error("E2E runtime env missing. Run Playwright global-setup first.");
  process.exit(1);
}

const runtimeEnv = JSON.parse(readFileSync(runtimeEnvPath, "utf8"));

const child = spawn("npm", ["run", "start"], {
  cwd: repoRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    ...runtimeEnv,
    TZ: "UTC",
    NODE_ENV: "production",
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
  },
});

child.on("exit", (code) => process.exit(code ?? 1));
