#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

import { redactDatabaseTarget } from "../lib/db/connection.mjs";
import { getMigrationStatus } from "../lib/db/migrations/runner.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(repoRoot, "supabase", "migrations");

function resolveMigrationUrl() {
  return (
    process.env.DATABASE_MIGRATION_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    null
  );
}

async function main() {
  const connectionString = resolveMigrationUrl();
  if (!connectionString) {
    console.log("db:status unavailable (DATABASE_URL not configured).");
    process.exit(0);
  }

  const pool = new Pool({ connectionString });
  try {
    const status = await getMigrationStatus({ pool, migrationsDir });
    console.log(
      JSON.stringify(
        {
          target: redactDatabaseTarget(connectionString),
          total: status.total,
          applied: status.applied,
          pending: status.pending,
          migrations: status.rows,
        },
        null,
        2,
      ),
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
