#!/usr/bin/env node
import { existsSync } from "node:fs";
import { join } from "node:path";

import {
  assertDockerAvailable,
  assertSecretPermissions,
  ensureConfigFile,
  runCompose,
  SECRETS_DIR,
  secretsReady,
  waitForWebHealth,
} from "./lib.mjs";
import { spawnSync } from "node:child_process";

async function main() {
  assertDockerAvailable();

  if (!secretsReady()) {
    console.log("Secrets not found. Running self-host:init...");
    const init = spawnSync("node", ["scripts/self-host/init.mjs"], {
      stdio: "inherit",
    });
    if (init.status !== 0) {
      process.exit(init.status ?? 1);
    }
  }

  ensureConfigFile();
  assertSecretPermissions();

  for (const name of ["postgres_owner_password", "postgres_runtime_password", "auth_secret", "bootstrap_token"]) {
    if (!existsSync(join(SECRETS_DIR, name))) {
      console.error(`Missing required secret file: ${name}`);
      process.exit(1);
    }
  }

  console.log("Building and starting Cited stack...");
  const build = runCompose(["up", "-d", "--build"]);
  if (build.status !== 0) {
    console.error("Failed to start stack. Run npm run self-host:logs for details.");
    process.exit(build.status ?? 1);
  }

  try {
    const { url } = await waitForWebHealth();
    console.log("");
    console.log("Cited is running.");
    console.log(`Application URL: ${url}`);
    console.log("Create the first owner at /setup using the one-time bootstrap token.");
    console.log("Retrieve the token with: npm run self-host:token");
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error("Run npm run self-host:doctor for diagnostics.");
    process.exit(1);
  }
}

main();
