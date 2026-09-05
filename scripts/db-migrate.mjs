#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

import { redactDatabaseTarget } from "../lib/db/connection.mjs";
import { runMigrations } from "../lib/db/migrations/runner.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(repoRoot, "supabase", "migrations");

function resolveMigrationUrl() {
  const migrationUrl = process.env.DATABASE_MIGRATION_URL?.trim();
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (migrationUrl) {
    return migrationUrl;
  }
  if (databaseUrl) {
    console.warn(
      "[cited] DATABASE_MIGRATION_URL is unset; falling back to DATABASE_URL for migrations.",
    );
    return databaseUrl;
  }
  throw new Error("DATABASE_MIGRATION_URL or DATABASE_URL is required.");
}

async function main() {
  const connectionString = resolveMigrationUrl();
  const pool = new Pool({ connectionString });
  try {
    const result = await runMigrations({
      pool,
      migrationsDir,
      logger: console,
    });
    console.log(
      `db:migrate complete (${result.total} migrations, ${result.pending} applied this run). Target: ${redactDatabaseTarget(connectionString)}`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
