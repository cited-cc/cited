#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { Pool } from "pg";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const seedSqlPath = join(repoRoot, "supabase", "seed.sql");

function resolveDatabaseUrl() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    null
  );
}

function assertSeedAllowed() {
  const mode = (process.env.CITED_DEPLOYMENT_MODE || "self_hosted").trim();
  const nodeEnv = process.env.NODE_ENV || "development";
  if (mode === "cloud" && nodeEnv === "production") {
    const override = process.env.CITED_ALLOW_CLOUD_SEED;
    if (override !== "true") {
      throw new Error(
        "Refusing to seed Cloud production. Set CITED_ALLOW_CLOUD_SEED=true to override.",
      );
    }
  }
}

async function seedPostgres(connectionString) {
  const sql = readFileSync(seedSqlPath, "utf8");
  const pool = new Pool({ connectionString });
  try {
    await pool.query(sql);
  } finally {
    await pool.end();
  }
}

async function main() {
  assertSeedAllowed();
  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for db:seed.");
  }
  await seedPostgres(databaseUrl);
  console.log("db:seed complete.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
