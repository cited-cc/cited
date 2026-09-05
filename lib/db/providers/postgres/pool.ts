import "server-only";

import { Pool } from "pg";

import { buildPgPoolConfig } from "@/lib/db/connection";
import { getDatabaseConfig, requirePostgresDatabaseUrl } from "@/lib/db/config";
import { createPostgresAdminClient } from "@/lib/db/providers/postgres/query-builder";

let sharedPool: Pool | null = null;

export function getPostgresPool(): Pool {
  if (sharedPool) {
    return sharedPool;
  }

  const config = getDatabaseConfig();
  const connectionString = requirePostgresDatabaseUrl();
  sharedPool = new Pool(
    buildPgPoolConfig({
      connectionString,
      pool: config.pool,
    }),
  );
  return sharedPool;
}

export function getPostgresAdminClient() {
  return createPostgresAdminClient(getPostgresPool());
}

export async function closePostgresPool(): Promise<void> {
  if (!sharedPool) {
    return;
  }
  await sharedPool.end();
  sharedPool = null;
}

export function resetPostgresPoolForTests(): void {
  sharedPool = null;
}
