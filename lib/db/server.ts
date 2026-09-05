import "server-only";

import { getSupabaseServerClient } from "@/lib/db/providers/supabase/client";
import { getDatabaseProvider } from "@/lib/db/config";
import type { Database } from "@/lib/db/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CitedSupabaseClient = SupabaseClient<Database>;

/**
 * Anon-key server client (Supabase provider only).
 * Prefer admin client for workspace-scoped mutations after membership checks.
 */
export function createServerSupabaseClient(): CitedSupabaseClient {
  if (getDatabaseProvider() !== "supabase") {
    throw new Error(
      "createServerSupabaseClient() is only available when CITED_DATABASE_PROVIDER=supabase.",
    );
  }
  return getSupabaseServerClient();
}
