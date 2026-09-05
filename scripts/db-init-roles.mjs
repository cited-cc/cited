#!/usr/bin/env node
import { Pool } from "pg";

import { buildPostgresConnectionUrl } from "../lib/db/build-connection-url.mjs";
import { hydrateSecretFilesFromEnv } from "../lib/env/secret-files.mjs";
import { resolveSecretFromEnv } from "../lib/env/secret-files.mjs";

hydrateSecretFilesFromEnv();

const databaseName = process.env.DATABASE_NAME ?? "cited";
const ownerRole = process.env.DATABASE_MIGRATION_USER ?? "cited_owner";
const runtimeRole = process.env.DATABASE_USER ?? "cited_app";

const ownerPassword =
  resolveSecretFromEnv("DATABASE_MIGRATION_PASSWORD") ??
  resolveSecretFromEnv("DATABASE_PASSWORD");
const runtimePassword = resolveSecretFromEnv("DATABASE_PASSWORD");

if (!ownerPassword || !runtimePassword) {
  throw new Error("Database role passwords are required for initialization.");
}

const adminUrl =
  process.env.DATABASE_ADMIN_URL?.trim() ??
  buildPostgresConnectionUrl({
    user: process.env.DATABASE_ADMIN_USER ?? "postgres",
    password: ownerPassword,
  });

const pool = new Pool({ connectionString: adminUrl });

async function roleExists(client, roleName) {
  const result = await client.query("SELECT 1 FROM pg_roles WHERE rolname = $1", [
    roleName,
  ]);
  return result.rowCount === 1;
}

async function ensureRole(client, roleName, password, options) {
  const exists = await roleExists(client, roleName);
  if (!exists) {
    await client.query(
      `CREATE ROLE ${quoteIdent(roleName)} LOGIN PASSWORD $1 ${options.createFlags}`,
      [password],
    );
    return;
  }
  await client.query(`ALTER ROLE ${quoteIdent(roleName)} PASSWORD $1`, [password]);
}

function quoteIdent(value) {
  return `"${value.replace(/"/g, '""')}"`;
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await ensureRole(client, ownerRole, ownerPassword, {
      createFlags: "CREATEDB",
    });
    await ensureRole(client, runtimeRole, runtimePassword, {
      createFlags: "NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION",
    });

    await client.query(
      `ALTER DATABASE ${quoteIdent(databaseName)} OWNER TO ${quoteIdent(ownerRole)}`,
    );

    await client.query(`REVOKE ALL ON DATABASE ${quoteIdent(databaseName)} FROM PUBLIC`);
    await client.query(
      `GRANT CONNECT ON DATABASE ${quoteIdent(databaseName)} TO ${quoteIdent(runtimeRole)}`,
    );

    await client.query(`GRANT USAGE ON SCHEMA public TO ${quoteIdent(runtimeRole)}`);
    await client.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${quoteIdent(runtimeRole)}`,
    );
    await client.query(
      `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${quoteIdent(runtimeRole)}`,
    );
    await client.query(
      `ALTER DEFAULT PRIVILEGES FOR ROLE ${quoteIdent(ownerRole)} IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${quoteIdent(runtimeRole)}`,
    );
    await client.query(
      `ALTER DEFAULT PRIVILEGES FOR ROLE ${quoteIdent(ownerRole)} IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${quoteIdent(runtimeRole)}`,
    );

    await client.query("COMMIT");
    console.log("[cited] Database roles initialized.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
