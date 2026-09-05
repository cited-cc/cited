#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import {
  hydrateSecretFilesFromEnv,
  readSecretFileContents,
  resolveSecretFromEnv,
} from "../../lib/env/secret-files.mjs";

const repoRoot = process.cwd();

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

function testSecretFiles() {
  const dir = mkdtempSync(join(tmpdir(), "cited-secret-test-"));
  const secretPath = join(dir, "secret");
  writeFileSync(secretPath, "abc123\n", { mode: 0o600 });

  assert(readSecretFileContents(secretPath) === "abc123", "trailing newline trimmed");
  assert(resolveSecretFromEnv("AUTH_SECRET", { AUTH_SECRET_FILE: secretPath }) === "abc123", "file resolution");

  try {
    resolveSecretFromEnv("AUTH_SECRET", {
      AUTH_SECRET: "direct",
      AUTH_SECRET_FILE: secretPath,
    });
    assert(false, "ambiguous config should throw");
  } catch (error) {
    assert(
      error instanceof Error && error.message.includes("Ambiguous"),
      "ambiguous config error",
    );
  }

  const env = { AUTH_SECRET_FILE: secretPath };
  hydrateSecretFilesFromEnv(env);
  assert(env.AUTH_SECRET === "abc123", "hydration sets direct env");
}

async function testSmoke() {
  if (spawnSync("docker", ["version"], { stdio: "ignore" }).status !== 0) {
    console.log("Docker unavailable: Compose smoke test incomplete (static checks only).");
    return;
  }

  const projectId = randomBytes(4).toString("hex");
  const projectName = `cited-phase11-test-${projectId}`;
  assert(projectName.startsWith("cited-phase11-test-"), "safe project prefix");

  console.log(`Starting isolated smoke project: ${projectName}`);
  const init = spawnSync("node", ["scripts/self-host/init.mjs"], {
    cwd: repoRoot,
    stdio: "inherit",
    env: { ...process.env, COMPOSE_PROJECT_NAME: projectName },
  });
  if (init.status !== 0) {
    console.error("Smoke init failed.");
    process.exit(init.status ?? 1);
  }

  const up = spawnSync(
    "docker",
    ["compose", "-f", "docker-compose.yml", "-p", projectName, "up", "-d", "--build"],
    { cwd: repoRoot, stdio: "inherit" },
  );
  if (up.status !== 0) {
    console.error("Smoke compose up failed.");
    process.exit(up.status ?? 1);
  }

  // Health wait via self-host status logic
  const status = spawnSync("node", ["scripts/self-host/status.mjs"], {
    cwd: repoRoot,
    stdio: "inherit",
    env: { ...process.env, COMPOSE_PROJECT_NAME: projectName },
  });
  if (status.status !== 0) {
    console.error("Smoke status failed.");
  }

  const inspect = spawnSync(
    "docker",
    ["compose", "-p", projectName, "ps", "--format", "{{.Name}}"],
    { cwd: repoRoot, encoding: "utf8" },
  );
  const names = (inspect.stdout ?? "").trim().split("\n").filter(Boolean);
  assert(
    names.every((name) => name.includes(projectName)),
    "teardown target validation",
  );

  spawnSync("docker", ["compose", "-p", projectName, "down", "-v"], {
    cwd: repoRoot,
    stdio: "inherit",
  });
  console.log(`Removed disposable smoke project: ${projectName}`);
}

async function main() {
  testSecretFiles();
  await testSmoke();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
