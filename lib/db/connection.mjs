export function redactDatabaseTarget(connectionString) {
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

export function parseDatabaseUrl(connectionString) {
  const parsed = new URL(connectionString);
  const host = parsed.hostname;
  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "host.docker.internal"]);
  return {
    host,
    port: parsed.port ? Number(parsed.port) : 5432,
    database: parsed.pathname.replace(/^\//, "") || "postgres",
    user: decodeURIComponent(parsed.username || "postgres"),
    isLocal: localHosts.has(host),
  };
}

export function isLocalDatabaseTarget(connectionString) {
  return parseDatabaseUrl(connectionString).isLocal;
}

export function isRemoteProductionLikeTarget(connectionString) {
  const target = parseDatabaseUrl(connectionString);
  if (target.isLocal) return false;
  const blockedHosts = [
    ".supabase.co",
    ".pooler.supabase.com",
    ".neon.tech",
    ".render.com",
    ".railway.app",
  ];
  return blockedHosts.some((suffix) => target.host.endsWith(suffix));
}
