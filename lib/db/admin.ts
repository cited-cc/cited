import "server-only";

import { getDeploymentMode } from "@/lib/deployment/mode";
import {
  getSupabaseAdminClient,
  type CitedSupabaseClient,
} from "@/lib/db/providers/supabase/client";
import { requireWorkspaceScope } from "@/lib/db/scope";

export { requireWorkspaceScope };

function resolveDatabaseProviderForAdmin(): "postgres" | "supabase" {
  const explicit = process.env.CITED_DATABASE_PROVIDER?.trim().toLowerCase();
  if (explicit === "postgres" || explicit === "supabase") {
    return explicit;
  }
  return getDeploymentMode() === "cloud" ? "supabase" : "postgres";
}

/**
 * Service-role admin client for trusted server operations.
 * Routes to Supabase or direct PostgreSQL based on CITED_DATABASE_PROVIDER.
 * Always pair with requireWorkspaceMembership / requireWorkspaceRole.
 * Never import from Client Components or expose to the browser.
 */
export function createAdminSupabaseClient(): CitedSupabaseClient {
  if (resolveDatabaseProviderForAdmin() === "postgres") {
    // Lazy load to keep the pg driver out of non-postgres server bundles.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getPostgresAdminClient } = require("@/lib/db/providers/postgres/pool") as typeof import("@/lib/db/providers/postgres/pool");
    return getPostgresAdminClient() as unknown as CitedSupabaseClient;
  }
  return getSupabaseAdminClient();
}
