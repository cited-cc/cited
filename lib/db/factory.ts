import "server-only";

import {
  getSupabaseAdminClient,
  type CitedSupabaseClient,
} from "@/lib/db/providers/supabase/client";
import { getDatabaseProvider } from "@/lib/db/config";

export type AdminDatabaseClient = CitedSupabaseClient;

export function getAdminClient(): AdminDatabaseClient {
  if (getDatabaseProvider() === "postgres") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getPostgresAdminClient } = require("@/lib/db/providers/postgres/pool") as typeof import("@/lib/db/providers/postgres/pool");
    return getPostgresAdminClient() as unknown as CitedSupabaseClient;
  }
  return getSupabaseAdminClient();
}

export async function withDatabaseTransaction<T>(
  callback: (client: AdminDatabaseClient) => Promise<T>,
): Promise<T> {
  if (getDatabaseProvider() === "postgres") {
    const [{ withPostgresTransaction }, { getPostgresPool }] = await Promise.all([
      import("@/lib/db/providers/postgres/query-builder"),
      import("@/lib/db/providers/postgres/pool"),
    ]);
    return withPostgresTransaction(getPostgresPool(), (client) =>
      callback(client as unknown as CitedSupabaseClient),
    );
  }

  return callback(getSupabaseAdminClient());
}

export function isPostgresAdminClient(): boolean {
  return getDatabaseProvider() === "postgres";
}
