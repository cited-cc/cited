import { resolveSecretFromEnv } from "../env/secret-files.mjs";

/**
 * Build a PostgreSQL connection URL from discrete components.
 * Passwords are resolved from DATABASE_PASSWORD or DATABASE_PASSWORD_FILE.
 * @param {{
 *   host?: string;
 *   port?: string | number;
 *   database?: string;
 *   user?: string;
 *   sslMode?: string;
 *   password?: string;
 *   passwordEnvPrefix?: string;
 * }} [input]
 */
export function buildPostgresConnectionUrl(input = {}) {
  const env = process.env;
  const prefix = input.passwordEnvPrefix ?? "DATABASE";
  const host = input.host ?? env.DATABASE_HOST ?? "127.0.0.1";
  const port = String(input.port ?? env.DATABASE_PORT ?? "5432");
  const database = input.database ?? env.DATABASE_NAME ?? "cited";
  const user = input.user ?? env.DATABASE_USER ?? "cited_app";

  const password =
    input.password ??
    resolveSecretFromEnv(/** @type {'DATABASE_PASSWORD'} */ ("DATABASE_PASSWORD")) ??
    (prefix === "DATABASE_MIGRATION"
      ? resolveSecretFromEnv("DATABASE_MIGRATION_PASSWORD")
      : undefined);

  if (!password) {
    throw new Error("Database password is required.");
  }

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  const sslMode = input.sslMode ?? env.DATABASE_SSL_MODE ?? "prefer";
  const url = new URL(
    `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${database}`,
  );
  if (sslMode && sslMode !== "prefer") {
    url.searchParams.set("sslmode", sslMode);
  }
  return url.toString();
}

/**
 * Populate DATABASE_URL and DATABASE_MIGRATION_URL when discrete values are configured.
 */
export function hydrateDatabaseUrlsFromEnv() {
  const env = process.env;
  const hasDiscrete =
    env.DATABASE_HOST ||
    env.DATABASE_PORT ||
    env.DATABASE_NAME ||
    env.DATABASE_USER ||
    env.DATABASE_PASSWORD_FILE ||
    env.DATABASE_MIGRATION_USER ||
    env.DATABASE_MIGRATION_PASSWORD_FILE;

  if (!hasDiscrete) {
    return;
  }

  if (!env.DATABASE_URL?.trim()) {
    env.DATABASE_URL = buildPostgresConnectionUrl({
      user: env.DATABASE_USER ?? "cited_app",
      passwordEnvPrefix: "DATABASE",
    });
  }

  if (!env.DATABASE_MIGRATION_URL?.trim()) {
    env.DATABASE_MIGRATION_URL = buildPostgresConnectionUrl({
      user: env.DATABASE_MIGRATION_USER ?? env.DATABASE_USER ?? "cited_owner",
      passwordEnvPrefix: "DATABASE_MIGRATION",
    });
  }
}
