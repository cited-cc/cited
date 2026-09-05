/**
 * Synthetic PostgreSQL helpers for integration and migration CI.
 * Never connects to Supabase or remote databases.
 */
import { randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const migrationsDir = join(repoRoot, "supabase", "migrations");
const seedSqlPath = join(repoRoot, "supabase", "seed.sql");

export const CI_SYNTHETIC_PASSWORD = "ci_fake_password_not_production_scope";

/**
 * @returns {boolean}
 */
export function isPostgresIntegrationEnabled() {
  return Boolean(
    process.env.CITED_INTEGRATION_DATABASE_URL?.trim() ||
      process.env.DATABASE_URL?.trim(),
  );
}

/**
 * @returns {string}
 */
export function resolveIntegrationDatabaseUrl() {
  const url =
    process.env.CITED_INTEGRATION_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "CITED_INTEGRATION_DATABASE_URL or DATABASE_URL is required for PostgreSQL integration tests.",
    );
  }
  return url;
}

/**
 * @param {string} adminUrl
 * @param {string} databaseName
 */
export async function createSyntheticDatabase(adminUrl, databaseName) {
  const pool = new Pool({ connectionString: adminUrl });
  try {
    await pool.query(`CREATE DATABASE ${quoteIdent(databaseName)}`);
  } finally {
    await pool.end();
  }
}

/**
 * @param {string} adminUrl
 * @param {string} databaseName
 */
export async function dropSyntheticDatabase(adminUrl, databaseName) {
  const pool = new Pool({ connectionString: adminUrl });
  try {
    await pool.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [databaseName],
    );
    await pool.query(`DROP DATABASE IF EXISTS ${quoteIdent(databaseName)}`);
  } finally {
    await pool.end();
  }
}

/**
 * @param {string} [prefix]
 */
export function createSyntheticDatabaseName(prefix = "cited_ci") {
  return `${prefix}_${randomBytes(4).toString("hex")}`;
}

/**
 * @param {string} value
 */
function quoteIdent(value) {
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * @param {import('pg').Pool} pool
 * @param {import('../lib/db/migrations/runner.mjs')} runner
 */
export async function applyAllMigrations(pool, runner) {
  const { runMigrations } = runner;
  return runMigrations({
    pool,
    migrationsDir,
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

export { migrationsDir, seedSqlPath, repoRoot };
