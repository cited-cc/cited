#!/usr/bin/env node
/**
 * Ephemeral PostgreSQL for local release gates. Synthetic CI scope only.
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";

import {
  createSyntheticDatabase,
  dropSyntheticDatabase,
} from "../tests/helpers/postgres-ci.mjs";

const CONTAINER_PREFIX = "cited-release-gate-postgres-";
const CI_PASSWORD = "ci_fake_password_not_production_scope";

function hasDocker() {
  return spawnSync("docker", ["version"], { stdio: "ignore" }).status === 0;
}

async function canConnect(url) {
  const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 2000 });
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    await pool.end();
  }
}

async function waitForPostgres(url, attempts = 30) {
  for (let i = 0; i < attempts; i += 1) {
    if (await canConnect(url)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

function startContainer() {
  const suffix = randomBytes(3).toString("hex");
  const name = `${CONTAINER_PREFIX}${suffix}`;
  const port = 55432 + Number.parseInt(suffix.slice(0, 2), 16) % 1000;
  const adminUrl = `postgresql://postgres:${CI_PASSWORD}@127.0.0.1:${port}/postgres`;

  const run = spawnSync(
    "docker",
    [
      "run",
      "-d",
      "--rm",
      "--name",
      name,
      "-e",
      `POSTGRES_PASSWORD=${CI_PASSWORD}`,
      "-p",
      `${port}:5432`,
      "postgres:17.2-bookworm",
    ],
    { encoding: "utf8", stdio: "pipe" },
  );

  if (run.status !== 0) {
    console.error("release-postgres: FAIL (could not start container)");
    if (run.stderr) process.stderr.write(run.stderr);
    process.exit(1);
  }

  return { name, port, adminUrl };
}

async function main() {
  const command = process.argv[2] ?? "ensure";

  if (command === "stop") {
    const name = process.env.CITED_RELEASE_POSTGRES_CONTAINER?.trim();
    if (name) {
      const adminUrl = process.env.CITED_RELEASE_POSTGRES_ADMIN_URL?.trim();
      if (adminUrl) {
        try {
          await dropSyntheticDatabase(adminUrl, "cited_ci_e2e");
        } catch {
          // Best-effort cleanup.
        }
      }
      spawnSync("docker", ["rm", "-f", name], { stdio: "ignore" });
    }
    process.exit(0);
  }

  const existingAdmin =
    process.env.CITED_MIGRATION_CI_ADMIN_URL?.trim() ||
    process.env.CITED_INTEGRATION_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim();

  if (existingAdmin && (await canConnect(existingAdmin))) {
    try {
      await createSyntheticDatabase(existingAdmin, "cited_ci_e2e");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("already exists")) {
        console.error("release-postgres: FAIL (could not prepare e2e database)");
        process.exit(1);
      }
    }
    console.log(
      JSON.stringify({
        level: "info",
        ruleId: "release-postgres-existing",
        adminUrl: existingAdmin.replace(/:[^:@/]+@/, ":***@"),
      }),
    );
    process.stdout.write(`${existingAdmin}\n`);
    process.exit(0);
  }

  if (!hasDocker()) {
    console.error("release-postgres: FAIL (PostgreSQL unavailable and Docker not found)");
    process.exit(1);
  }

  const { name, port, adminUrl } = startContainer();
  const ready = await waitForPostgres(adminUrl);
  if (!ready) {
    spawnSync("docker", ["rm", "-f", name], { stdio: "ignore" });
    console.error("release-postgres: FAIL (container did not become ready)");
    process.exit(1);
  }

  const e2eDatabase = "cited_ci_e2e";
  try {
    await createSyntheticDatabase(adminUrl, e2eDatabase);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("already exists")) {
      spawnSync("docker", ["rm", "-f", name], { stdio: "ignore" });
      console.error("release-postgres: FAIL (could not create e2e database)");
      process.exit(1);
    }
  }

  process.env.CITED_RELEASE_POSTGRES_CONTAINER = name;
  process.env.CITED_RELEASE_POSTGRES_ADMIN_URL = adminUrl;
  console.log(
    JSON.stringify({
      level: "info",
      ruleId: "release-postgres-started",
      container: name,
      port,
    }),
  );
  process.stdout.write(`${adminUrl}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "release-postgres failed");
  process.exit(1);
});
