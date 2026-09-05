#!/usr/bin/env node
/**
 * Dedicated migration verification for CI and local parity.
 * Uses synthetic PostgreSQL only. Never contacts Supabase or remote databases.
 */
import { readFileSync } from "node:fs";
import { Pool } from "pg";

import {
  applyAllMigrations,
  createSyntheticDatabase,
  createSyntheticDatabaseName,
  dropSyntheticDatabase,
  migrationsDir,
  seedSqlPath,
} from "../tests/helpers/postgres-ci.mjs";

const runner = await import("../lib/db/migrations/runner.mjs");
const { validateMigrationDirectory, runMigrations, loadAppliedMigrations, readMigration } =
  runner;

function resolveAdminUrl() {
  const url =
    process.env.CITED_MIGRATION_CI_ADMIN_URL?.trim() ||
    process.env.DATABASE_ADMIN_URL?.trim() ||
    process.env.CITED_INTEGRATION_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("db:migration-ci: SKIP (no DATABASE_URL configured)");
    process.exit(0);
  }
  const parsed = new URL(url);
  parsed.pathname = "/postgres";
  return parsed.toString();
}

function databaseUrl(adminUrl, databaseName) {
  const parsed = new URL(adminUrl);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
}

async function main() {
  process.env.TZ = "UTC";

  const { findings } = validateMigrationDirectory(migrationsDir);
  if (findings.length > 0) {
    console.error("db:migration-ci: FAIL (forbidden migration SQL)");
    for (const finding of findings) {
      console.error(`- ${finding.filename}: ${finding.message}`);
    }
    process.exit(1);
  }

  const adminUrl = resolveAdminUrl();
  const databaseName = createSyntheticDatabaseName("cited_migration_ci");
  await createSyntheticDatabase(adminUrl, databaseName);

  const connectionString = databaseUrl(adminUrl, databaseName);
  const pool = new Pool({ connectionString });

  try {
    const first = await applyAllMigrations(pool, runner);
    const second = await runMigrations({
      pool,
      migrationsDir,
      logger: console,
    });

    if (second.pending !== 0) {
      throw new Error("Re-applying migrations reported pending work.");
    }

    const applied = await loadAppliedMigrations(pool);
    for (const row of applied) {
      const { checksum } = readMigration(migrationsDir, row.filename);
      if (row.checksum !== checksum) {
        throw new Error(`Checksum mismatch for ${row.filename}`);
      }
    }

    const seedSql = readFileSync(seedSqlPath, "utf8");
    await pool.query(seedSql);
    await pool.query(seedSql);

    const extensions = await pool.query(
      `SELECT extname FROM pg_extension WHERE extname IN ('pgcrypto')`,
    );
    if (extensions.rowCount === 0) {
      throw new Error("Required extension pgcrypto is missing.");
    }

    const pendingAfterSeed = await runMigrations({
      pool,
      migrationsDir,
      logger: console,
    });
    if (pendingAfterSeed.pending !== 0) {
      throw new Error("Pending migrations remain after seed.");
    }

    console.log(
      `db:migration-ci: PASS (${first.total} migrations, database ${databaseName})`,
    );
  } catch (error) {
    console.error(
      `db:migration-ci: FAIL (${error instanceof Error ? error.message : String(error)})`,
    );
    process.exit(1);
  } finally {
    await pool.end();
    await dropSyntheticDatabase(adminUrl, databaseName);
  }
}

main();
