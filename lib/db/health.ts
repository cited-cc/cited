import "server-only";

import { Pool } from "pg";

import { getDatabaseConfig, getDatabaseProvider } from "@/lib/db/config";
import { mapPgError } from "@/lib/db/errors";
import type { DatabaseHealthSnapshot } from "@/lib/db/provider";
import { getSupabaseAdminClient } from "@/lib/db/providers/supabase/client";

const MIGRATION_TABLE = "cited_schema_migrations";

async function checkPostgresHealth(): Promise<DatabaseHealthSnapshot> {
  const config = getDatabaseConfig();
  if (!config.databaseUrl) {
    return {
      state: "unavailable",
      provider: "postgres",
      schemaVersion: null,
      pendingMigrations: 0,
    };
  }

  const pool = new Pool({ connectionString: config.databaseUrl });
  try {
    await pool.query("SELECT 1");
    const ext = await pool.query(
      "SELECT extname FROM pg_extension WHERE extname = ANY($1::text[])",
      [["pgcrypto"]],
    );
    if (ext.rowCount !== 1) {
      return {
        state: "unavailable",
        provider: "postgres",
        schemaVersion: null,
        pendingMigrations: 0,
      };
    }

    const migrationTable = await pool.query(
      `SELECT to_regclass('public.${MIGRATION_TABLE}') AS regclass`,
    );
    if (!migrationTable.rows[0]?.regclass) {
      return {
        state: "migrations_pending",
        provider: "postgres",
        schemaVersion: null,
        pendingMigrations: 1,
      };
    }

    const applied = await pool.query(
      `SELECT filename FROM public.${MIGRATION_TABLE} ORDER BY filename DESC LIMIT 1`,
    );
    const schemaVersion = applied.rows[0]?.filename ?? null;
    return {
      state: "ready",
      provider: "postgres",
      schemaVersion,
      pendingMigrations: 0,
    };
  } catch {
    return {
      state: "unavailable",
      provider: "postgres",
      schemaVersion: null,
      pendingMigrations: 0,
    };
  } finally {
    await pool.end();
  }
}

async function checkSupabaseHealth(): Promise<DatabaseHealthSnapshot> {
  try {
    const admin = getSupabaseAdminClient();
    const { error } = await admin.from("workspaces").select("id", { head: true, count: "exact" });
    if (error) {
      return {
        state: "unavailable",
        provider: "supabase",
        schemaVersion: null,
        pendingMigrations: 0,
      };
    }
    return {
      state: "ready",
      provider: "supabase",
      schemaVersion: null,
      pendingMigrations: 0,
    };
  } catch (error) {
    mapPgError(error);
    return {
      state: "unavailable",
      provider: "supabase",
      schemaVersion: null,
      pendingMigrations: 0,
    };
  }
}

export async function getDatabaseHealthSnapshot(): Promise<DatabaseHealthSnapshot> {
  const provider = getDatabaseProvider();
  if (provider === "postgres") {
    return checkPostgresHealth();
  }
  return checkSupabaseHealth();
}

export function getPublicDatabaseHealthPayload(snapshot: DatabaseHealthSnapshot): {
  database: DatabaseHealthSnapshot["state"];
  provider: DatabaseHealthSnapshot["provider"];
} {
  return {
    database: snapshot.state,
    provider: snapshot.provider,
  };
}
