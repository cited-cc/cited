#!/usr/bin/env node
import { existsSync } from "node:fs";
import {
  assertDockerAvailable,
  assertSecretPermissions,
  COMPOSE_FILE,
  composeEnv,
  CONFIG_PATH,
  gitHasRemote,
  REPO_ROOT,
  secretsReady,
  SECRETS_DIR,
} from "./lib.mjs";
import { spawnSync } from "node:child_process";

function check(name, ok, detail) {
  console.log(`${ok ? "ok" : "fail"}  ${name}${detail ? `: ${detail}` : ""}`);
  return ok;
}

function main() {
  let healthy = true;

  healthy = check("repository path", existsSync(REPO_ROOT), REPO_ROOT) && healthy;
  healthy =
    check("publication candidate", REPO_ROOT.endsWith("cited-public"), "cited-public") &&
    healthy;
  healthy = check("git remote absent", !gitHasRemote()) && healthy;
  healthy = check("docker available", spawnSync("docker", ["version"], { stdio: "ignore" }).status === 0) && healthy;
  healthy =
    check(
      "compose available",
      spawnSync("docker", ["compose", "version"], { stdio: "ignore" }).status === 0,
    ) && healthy;
  healthy = check("compose file", existsSync(COMPOSE_FILE)) && healthy;
  healthy = check("config file", existsSync(CONFIG_PATH)) && healthy;
  healthy = check("secrets directory", existsSync(SECRETS_DIR)) && healthy;
  healthy = check("secrets generated", secretsReady()) && healthy;

  try {
    assertSecretPermissions();
    healthy = check("secret permissions", true) && healthy;
  } catch (error) {
    healthy =
      check(
        "secret permissions",
        false,
        error instanceof Error ? error.message : String(error),
      ) && healthy;
  }

  const env = composeEnv();
  healthy =
    check(
      "default monitoring provider",
      (env.CITED_MONITORING_PROVIDER ?? "mock") === "mock",
    ) && healthy;
  healthy =
    check(
      "notifications disabled by default",
      (env.NOTIFICATIONS_ENABLED ?? "false") === "false",
    ) && healthy;

  try {
    assertDockerAvailable();
    const ps = spawnSync(
      "docker",
      ["compose", "-f", COMPOSE_FILE, "ps", "--format", "json"],
      { cwd: REPO_ROOT, env: composeEnv(), encoding: "utf8" },
    );
    healthy = check("compose project inspectable", ps.status === 0) && healthy;
  } catch (error) {
    healthy =
      check(
        "compose project inspectable",
        false,
        error instanceof Error ? error.message : String(error),
      ) && healthy;
  }

  const boundary = spawnSync("node", ["scripts/check-docker-boundaries.mjs"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  healthy = check("docker boundary check", boundary.status === 0) && healthy;

  process.exit(healthy ? 0 : 1);
}

main();
