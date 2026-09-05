import "server-only";

import type { PoolConfig } from "pg";

import type { DatabasePoolConfig, DatabaseSslMode } from "@/lib/db/config";
import { redactDatabaseMessage } from "@/lib/db/errors";

const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "host.docker.internal",
]);

export type ParsedDatabaseTarget = {
  host: string;
  port: number;
  database: string;
  user: string;
  isLocal: boolean;
};

export function parseDatabaseUrl(connectionString: string): ParsedDatabaseTarget {
  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch (error) {
    throw new Error(
      redactDatabaseMessage(
        error instanceof Error ? error.message : "Invalid database connection string.",
      ),
    );
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("Database URL must use postgres:// or postgresql://.");
  }

  const host = parsed.hostname;
  const port = parsed.port ? Number(parsed.port) : 5432;
  const database = parsed.pathname.replace(/^\//, "") || "postgres";
  const user = decodeURIComponent(parsed.username || "postgres");

  return {
    host,
    port,
    database,
    user,
    isLocal: LOCAL_HOSTS.has(host),
  };
}

export function redactDatabaseTarget(connectionString: string): string {
  try {
    const parsed = new URL(connectionString);
    if (parsed.password) {
      parsed.password = "[redacted]";
    }
    parsed.search = "";
    return parsed.toString();
  } catch {
    return "[invalid-database-url]";
  }
}

export function resolveSslConfig(
  sslMode: DatabaseSslMode,
  target: ParsedDatabaseTarget,
): PoolConfig["ssl"] {
  if (sslMode === "disable") {
    return false;
  }

  if (target.isLocal && sslMode === "prefer") {
    return false;
  }

  if (sslMode === "require" || sslMode === "prefer") {
    return { rejectUnauthorized: sslMode === "require" ? true : target.isLocal ? false : true };
  }

  return { rejectUnauthorized: true };
}

export function buildPgPoolConfig(input: {
  connectionString: string;
  pool: DatabasePoolConfig;
}): PoolConfig {
  const target = parseDatabaseUrl(input.connectionString);
  return {
    connectionString: input.connectionString,
    max: input.pool.max,
    idleTimeoutMillis: input.pool.idleTimeoutSeconds * 1000,
    connectionTimeoutMillis: input.pool.connectTimeoutSeconds * 1000,
    ssl: resolveSslConfig(input.pool.sslMode, target),
  };
}

export function isLocalDatabaseTarget(connectionString: string): boolean {
  return parseDatabaseUrl(connectionString).isLocal;
}

export function isRemoteProductionLikeTarget(connectionString: string): boolean {
  const target = parseDatabaseUrl(connectionString);
  if (target.isLocal) {
    return false;
  }
  const blockedHosts = [
    ".supabase.co",
    ".pooler.supabase.com",
    ".neon.tech",
    ".render.com",
    ".railway.app",
  ];
  return blockedHosts.some((suffix) => target.host.endsWith(suffix));
}
