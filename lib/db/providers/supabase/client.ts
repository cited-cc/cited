import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getOptionalServerEnv } from "@/lib/env";
import type { Database } from "@/lib/db/types";

export type CitedSupabaseClient = SupabaseClient<Database>;

let cachedAdminClient: CitedSupabaseClient | null = null;
let cachedServerClient: CitedSupabaseClient | null = null;

export function createSupabaseAdminClient(): CitedSupabaseClient {
  const env = getOptionalServerEnv();
  const url = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for Supabase database access.",
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseAdminClient(): CitedSupabaseClient {
  if (!cachedAdminClient) {
    cachedAdminClient = createSupabaseAdminClient();
  }
  return cachedAdminClient;
}

export function createSupabaseServerClient(): CitedSupabaseClient {
  const env = getOptionalServerEnv();
  const url = env.SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required.");
  }
  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseServerClient(): CitedSupabaseClient {
  if (!cachedServerClient) {
    cachedServerClient = createSupabaseServerClient();
  }
  return cachedServerClient;
}

export function resetSupabaseClientsForTests(): void {
  cachedAdminClient = null;
  cachedServerClient = null;
}
