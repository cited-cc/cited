import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const MIGRATION_TABLE = "cited_schema_migrations";
export const MIGRATION_LOCK_KEY = 90260731150001;

const MIGRATION_FILENAME_PATTERN = /^(\d{14})_[a-z0-9_]+\.sql$/;

export function listMigrationFiles(migrationsDir) {
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    throw new Error("Migration directory is empty.");
  }

  const seen = new Set();
  for (const file of files) {
    if (!MIGRATION_FILENAME_PATTERN.test(file)) {
      throw new Error(`Invalid migration filename: ${file}`);
    }
    const id = file.slice(0, 14);
    if (seen.has(id)) {
      throw new Error(`Duplicate migration identifier: ${id}`);
    }
    seen.add(id);
  }

  return files;
}

export function readMigration(migrationsDir, filename) {
  const absolute = join(migrationsDir, filename);
  const sql = readFileSync(absolute, "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");
  return { filename, sql, checksum };
}

export function validateMigrationSql(sql, filename) {
  const findings = [];
  const forbidden = [
    { pattern: /\bdrop\s+database\b/i, message: "DROP DATABASE is forbidden." },
    { pattern: /\bdrop\s+schema\s+public\b/i, message: "DROP SCHEMA public is forbidden." },
    { pattern: /\bauth\./i, message: "auth schema references are forbidden in portable migrations." },
  ];

  for (const rule of forbidden) {
    if (rule.pattern.test(sql)) {
      findings.push({ filename, message: rule.message });
    }
  }

  return findings;
}

export function validateMigrationDirectory(migrationsDir) {
  const files = listMigrationFiles(migrationsDir);
  const findings = [];
  for (const file of files) {
    const { sql } = readMigration(migrationsDir, file);
    findings.push(...validateMigrationSql(sql, file));
  }
  return { files, findings };
}

export async function ensureMigrationTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.${MIGRATION_TABLE} (
      filename text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT timezone('utc', now())
    );
  `);
}

export async function acquireMigrationLock(client) {
  const result = await client.query(
    "SELECT pg_try_advisory_lock($1::bigint) AS locked",
    [MIGRATION_LOCK_KEY],
  );
  if (!result.rows[0]?.locked) {
    throw new Error("Another migration runner holds the advisory lock.");
  }
}

export async function releaseMigrationLock(client) {
  await client.query("SELECT pg_advisory_unlock($1::bigint)", [MIGRATION_LOCK_KEY]);
}

export async function loadAppliedMigrations(client) {
  await ensureMigrationTable(client);
  const result = await client.query(
    `SELECT filename, checksum FROM public.${MIGRATION_TABLE} ORDER BY filename ASC`,
  );
  return result.rows;
}

export function preprocessMigrationSql(sql) {
  return sql.replace(
    /grant execute on function ([^;]+) to service_role;/gi,
    (_match, target) => `DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN GRANT EXECUTE ON FUNCTION ${target.trim()} TO service_role; END IF; END $$;`,
  );
}

export async function applyMigration(client, migration) {
  const sql = preprocessMigrationSql(migration.sql);
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query(
      `INSERT INTO public.${MIGRATION_TABLE} (filename, checksum) VALUES ($1, $2)`,
      [migration.filename, migration.checksum],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function runMigrations({ pool, migrationsDir, logger = console }) {
  const files = listMigrationFiles(migrationsDir);
  const client = await pool.connect();
  try {
    await acquireMigrationLock(client);
    const applied = await loadAppliedMigrations(client);
    const appliedByName = new Map(applied.map((row) => [row.filename, row.checksum]));

    for (const file of files) {
      const migration = readMigration(migrationsDir, file);
      const existingChecksum = appliedByName.get(file);
      if (existingChecksum) {
        if (existingChecksum !== migration.checksum) {
          throw new Error(`Checksum mismatch for applied migration ${file}.`);
        }
        continue;
      }

      logger.info?.(`Applying migration ${file}`);
      await applyMigration(client, migration);
    }

    return {
      total: files.length,
      pending: files.filter((file) => !appliedByName.has(file)).length,
    };
  } finally {
    try {
      await releaseMigrationLock(client);
    } catch {
      // ignore unlock failures during shutdown
    }
    client.release();
  }
}

export async function getMigrationStatus({ pool, migrationsDir }) {
  const files = listMigrationFiles(migrationsDir);
  const client = await pool.connect();
  try {
    const applied = await loadAppliedMigrations(client);
    const appliedByName = new Map(applied.map((row) => [row.filename, row.checksum]));
    const rows = files.map((file) => {
      const migration = readMigration(migrationsDir, file);
      const appliedChecksum = appliedByName.get(file);
      return {
        filename: file,
        applied: Boolean(appliedChecksum),
        checksumOk: appliedChecksum ? appliedChecksum === migration.checksum : null,
      };
    });
    return {
      total: files.length,
      applied: rows.filter((row) => row.applied).length,
      pending: rows.filter((row) => !row.applied).length,
      rows,
    };
  } finally {
    client.release();
  }
}
