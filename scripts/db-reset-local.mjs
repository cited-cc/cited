#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Pool } from "pg";

import {
  isLocalDatabaseTarget,
  isRemoteProductionLikeTarget,
  parseDatabaseUrl,
  redactDatabaseTarget,
} from "../lib/db/connection.mjs";

function resolveTargetUrl() {
  const url =
    process.env.DATABASE_MIGRATION_URL?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is required for db:reset:local.");
  }
  return url;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("db:reset:local is unavailable in production.");
  }
  if (process.env.CITED_ALLOW_DB_RESET !== "true") {
    throw new Error("Set CITED_ALLOW_DB_RESET=true to run db:reset:local.");
  }
  if ((process.env.CITED_DEPLOYMENT_MODE || "").trim() === "cloud") {
    throw new Error("db:reset:local is unavailable in cloud deployment mode.");
  }

  const connectionString = resolveTargetUrl();
  if (!isLocalDatabaseTarget(connectionString)) {
    throw new Error("db:reset:local refuses non-local database targets.");
  }
  if (isRemoteProductionLikeTarget(connectionString)) {
    throw new Error("db:reset:local refuses remote production-like targets.");
  }

  const target = parseDatabaseUrl(connectionString);
  const redacted = redactDatabaseTarget(connectionString);
  console.log(`Target: ${redacted}`);

  if (process.env.CITED_DB_RESET_AUTO_CONFIRM !== "true") {
    const rl = createInterface({ input, output });
    const answer = await rl.question(
      `Type the database name "${target.database}" to confirm destructive reset: `,
    );
    rl.close();
    if (answer.trim() !== target.database) {
      throw new Error("Reset confirmation did not match database name.");
    }
  }

  const adminUrl = connectionString.replace(`/${target.database}`, "/postgres");
  const pool = new Pool({ connectionString: adminUrl });
  try {
    await pool.query(
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
      [target.database],
    );
    await pool.query(`DROP DATABASE IF EXISTS ${quoteIdent(target.database)}`);
    await pool.query(`CREATE DATABASE ${quoteIdent(target.database)}`);
    console.log(`db:reset:local recreated database ${target.database}.`);
  } finally {
    await pool.end();
  }
}

function quoteIdent(value) {
  return `"${value.replace(/"/g, '""')}"`;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
