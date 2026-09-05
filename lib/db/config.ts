import "server-only";

import { buildPostgresConnectionUrl } from "@/lib/db/build-connection-url.mjs";
import { getDeploymentMode, isCloudDeployment, isSelfHostedDeployment } from "@/lib/deployment/mode";
import { DatabaseError } from "@/lib/db/errors";
import type { DatabaseProvider } from "@/lib/db/provider";
import { DATABASE_PROVIDERS } from "@/lib/db/provider";
import { resolveSecretFromEnv } from "@/lib/env/secret-files.mjs";

export const DATABASE_PROVIDER_ENV = "CITED_DATABASE_PROVIDER" as const;

export type DatabaseSslMode =
  | "disable"
  | "prefer"
  | "require"
  | "verify-full";

export type DatabasePoolConfig = {
  max: number;
  idleTimeoutSeconds: number;
  connectTimeoutSeconds: number;
  sslMode: DatabaseSslMode;
};

export type ResolvedDatabaseConfig = {
  provider: DatabaseProvider;
  databaseUrl?: string;
  migrationUrl?: string;
  pool: DatabasePoolConfig;
};

const DEFAULT_POOL_MAX = 10;
const DEFAULT_IDLE_TIMEOUT_SECONDS = 30;
const DEFAULT_CONNECT_TIMEOUT_SECONDS = 10;

let cachedProvider: DatabaseProvider | null = null;
let cachedConfig: ResolvedDatabaseConfig | null = null;

function normalizeProvider(raw: unknown): DatabaseProvider | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const normalized = String(raw).trim().toLowerCase();
  if ((DATABASE_PROVIDERS as readonly string[]).includes(normalized)) {
    return normalized as DatabaseProvider;
  }
  return undefined;
}

function parsePositiveInt(
  raw: unknown,
  fallback: number,
  min: number,
  max: number,
  label: string,
): number {
  if (raw === undefined || raw === null || raw === "") {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new DatabaseError(
      "configuration_error",
      `${label} must be a positive integer.`,
    );
  }
  if (parsed < min || parsed > max) {
    throw new DatabaseError(
      "configuration_error",
      `${label} must be between ${min} and ${max}.`,
    );
  }
  return parsed;
}

function parseSslMode(raw: unknown): DatabaseSslMode {
  if (raw === undefined || raw === null || raw === "") {
    return "prefer";
  }
  const normalized = String(raw).trim().toLowerCase();
  if (
    normalized === "disable" ||
    normalized === "prefer" ||
    normalized === "require" ||
    normalized === "verify-full"
  ) {
    return normalized;
  }
  throw new DatabaseError(
    "configuration_error",
    "DATABASE_SSL_MODE must be disable, prefer, require, or verify-full.",
  );
}

function resolveProviderUncached(): DatabaseProvider {
  const explicit = normalizeProvider(process.env[DATABASE_PROVIDER_ENV]);
  if (explicit) {
    const mode = getDeploymentMode();
    if (mode === "cloud" && explicit !== "supabase") {
      throw new DatabaseError(
        "provider_mismatch",
        "Cloud deployment mode requires CITED_DATABASE_PROVIDER=supabase.",
      );
    }
    return explicit;
  }

  if (isCloudDeployment()) {
    return "supabase";
  }
  if (isSelfHostedDeployment()) {
    return "postgres";
  }

  throw new DatabaseError(
    "configuration_error",
    "Unable to resolve database provider.",
  );
}

export function getDatabaseProvider(): DatabaseProvider {
  if (cachedProvider) {
    return cachedProvider;
  }
  cachedProvider = resolveProviderUncached();
  return cachedProvider;
}

function hasDiscreteDatabaseConfig(): boolean {
  const env = process.env;
  return Boolean(
    env.DATABASE_HOST ||
      env.DATABASE_PORT ||
      env.DATABASE_NAME ||
      env.DATABASE_USER ||
      env.DATABASE_PASSWORD ||
      env.DATABASE_PASSWORD_FILE ||
      env.DATABASE_MIGRATION_USER ||
      env.DATABASE_MIGRATION_PASSWORD ||
      env.DATABASE_MIGRATION_PASSWORD_FILE,
  );
}

export function resolveDatabaseUrl(provider: DatabaseProvider): string | undefined {
  if (provider === "supabase") {
    return undefined;
  }

  const direct =
    process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim() || undefined;
  if (direct) {
    return direct;
  }

  if (hasDiscreteDatabaseConfig()) {
    try {
      return buildPostgresConnectionUrl({
        user: process.env.DATABASE_USER ?? "cited_app",
      });
    } catch {
      return undefined;
    }
  }

  return undefined;
}

export function resolveMigrationUrl(provider: DatabaseProvider): string | undefined {
  if (provider === "supabase") {
    return undefined;
  }

  const direct = process.env.DATABASE_MIGRATION_URL?.trim();
  if (direct) {
    return direct;
  }

  if (hasDiscreteDatabaseConfig()) {
    try {
      return buildPostgresConnectionUrl({
        user: process.env.DATABASE_MIGRATION_USER ?? "cited_owner",
        password:
          resolveSecretFromEnv("DATABASE_MIGRATION_PASSWORD") ??
          resolveSecretFromEnv("DATABASE_PASSWORD"),
      });
    } catch {
      return undefined;
    }
  }

  return resolveDatabaseUrl(provider);
}

export function getDatabaseConfig(): ResolvedDatabaseConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const provider = getDatabaseProvider();
  const pool: DatabasePoolConfig = {
    max: parsePositiveInt(
      process.env.DATABASE_POOL_MAX,
      DEFAULT_POOL_MAX,
      1,
      100,
      "DATABASE_POOL_MAX",
    ),
    idleTimeoutSeconds: parsePositiveInt(
      process.env.DATABASE_IDLE_TIMEOUT_SECONDS,
      DEFAULT_IDLE_TIMEOUT_SECONDS,
      1,
      600,
      "DATABASE_IDLE_TIMEOUT_SECONDS",
    ),
    connectTimeoutSeconds: parsePositiveInt(
      process.env.DATABASE_CONNECT_TIMEOUT_SECONDS,
      DEFAULT_CONNECT_TIMEOUT_SECONDS,
      1,
      120,
      "DATABASE_CONNECT_TIMEOUT_SECONDS",
    ),
    sslMode: parseSslMode(process.env.DATABASE_SSL_MODE),
  };

  cachedConfig = {
    provider,
    databaseUrl: resolveDatabaseUrl(provider),
    migrationUrl: resolveMigrationUrl(provider),
    pool,
  };

  return cachedConfig;
}

export function requirePostgresDatabaseUrl(): string {
  const url = resolveDatabaseUrl("postgres");
  if (!url) {
    throw new DatabaseError(
      "configuration_error",
      "DATABASE_URL is required when CITED_DATABASE_PROVIDER=postgres.",
    );
  }
  return url;
}

export function resetDatabaseConfigCacheForTests(): void {
  cachedProvider = null;
  cachedConfig = null;
}
