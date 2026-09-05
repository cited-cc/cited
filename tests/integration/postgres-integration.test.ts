import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";

import {
  applyAllMigrations,
  createSyntheticDatabase,
  createSyntheticDatabaseName,
  dropSyntheticDatabase,
  isPostgresIntegrationEnabled,
  migrationsDir,
  resolveIntegrationDatabaseUrl,
  seedSqlPath,
} from "../helpers/postgres-ci.mjs";

const require = createRequire(import.meta.url);
const runner = require("../../lib/db/migrations/runner.mjs");
const { runMigrations, loadAppliedMigrations, readMigration } = runner;

const integrationEnabled = isPostgresIntegrationEnabled();
const describeIntegration = integrationEnabled ? describe : describe.skip;

let pool: Pool | null = null;
let databaseName: string | null = null;
let adminUrl: string | null = null;

function buildAdminUrl(baseUrl: string, database = "postgres"): string {
  const parsed = new URL(baseUrl);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}

describeIntegration("PostgreSQL integration", () => {
  function requirePool(): Pool {
    if (!pool) {
      throw new Error("PostgreSQL pool is not initialized.");
    }
    return pool;
  }

  beforeAll(async () => {
    process.env.TZ = "UTC";
    process.env.CITED_DEPLOYMENT_MODE = "self_hosted";
    process.env.CITED_DATABASE_PROVIDER = "postgres";

    const baseUrl = resolveIntegrationDatabaseUrl();
    adminUrl = buildAdminUrl(baseUrl);
    databaseName = createSyntheticDatabaseName("cited_integration");

    await createSyntheticDatabase(adminUrl, databaseName);

    const databaseUrl = buildAdminUrl(baseUrl, databaseName);
    process.env.DATABASE_URL = databaseUrl;
    process.env.DATABASE_MIGRATION_URL = databaseUrl;

    pool = new Pool({ connectionString: databaseUrl });
  }, 120_000);

  afterAll(async () => {
    if (pool) {
      await pool.end();
      pool = null;
    }
    if (adminUrl && databaseName) {
      await dropSyntheticDatabase(adminUrl, databaseName);
    }
  }, 60_000);

  it("applies migrations on an empty database", async () => {
    const result = await applyAllMigrations(requirePool(), runner);
    expect(result.total).toBeGreaterThan(0);
    expect(result.pending).toBeGreaterThan(0);
  });

  it("re-applies migrations safely with zero pending", async () => {
    const activePool = requirePool();
    const secondRun = await runMigrations({
      pool: activePool,
      migrationsDir,
      logger: { log: () => {}, warn: () => {}, error: () => {} },
    });
    expect(secondRun.pending).toBe(0);
  });

  it("enforces migration checksum integrity", async () => {
    const applied = await loadAppliedMigrations(requirePool());
    expect(applied.length).toBeGreaterThan(0);

    for (const row of applied) {
      const { checksum } = readMigration(migrationsDir, row.filename);
      expect(row.checksum).toBe(checksum);
    }
  });

  it("runs seed idempotently", async () => {
    const activePool = requirePool();
    const sql = readFileSync(seedSqlPath, "utf8");
    await activePool.query(sql);
    await expect(activePool.query(sql)).resolves.toBeDefined();
  });

  it("creates canonical auth identities and workspace roles", async () => {
    const activePool = requirePool();
    const email = "owner.integration@example.com";
    const passwordHash = "scrypt-v1$test$placeholder";

    const userInsert = await activePool.query(
      `INSERT INTO users (id, email_normalized, display_name, status)
       VALUES (gen_random_uuid(), $1, 'Integration Owner', 'active')
       RETURNING id`,
      [email],
    );
    const userId = userInsert.rows[0].id;

    await activePool.query(
      `INSERT INTO local_credentials (user_id, password_hash, password_changed_at)
       VALUES ($1, $2, timezone('utc', now()))`,
      [userId, passwordHash],
    );

    const workspaceInsert = await activePool.query(
      `INSERT INTO workspaces (id, name, slug, owner_user_id, owner_clerk_user_id, plan_key, status)
       VALUES (gen_random_uuid(), 'Integration Workspace', 'integration-ws', $1, $2, 'free', 'active')
       RETURNING id`,
      [userId, `local:${userId}`],
    );
    const workspaceId = workspaceInsert.rows[0].id;

    await activePool.query(
      `INSERT INTO workspace_members (workspace_id, user_id, clerk_user_id, role)
       VALUES ($1, $2, $3, 'owner')`,
      [workspaceId, userId, `local:${userId}`],
    );

    const memberCount = await activePool.query(
      `SELECT count(*)::int AS count FROM workspace_members WHERE workspace_id = $1`,
      [workspaceId],
    );
    expect(memberCount.rows[0].count).toBe(1);
  });

  it("denies cross-workspace reads without membership", async () => {
    const activePool = requirePool();
    const wsA = (
      await activePool.query(
        `INSERT INTO workspaces (id, name, slug, owner_clerk_user_id, plan_key, status)
         VALUES (gen_random_uuid(), 'Workspace A', 'ws-a', 'local:00000000-0000-4000-8000-000000000001', 'free', 'active')
         RETURNING id`,
      )
    ).rows[0].id;

    const wsB = (
      await activePool.query(
        `INSERT INTO workspaces (id, name, slug, owner_clerk_user_id, plan_key, status)
         VALUES (gen_random_uuid(), 'Workspace B', 'ws-b', 'local:00000000-0000-4000-8000-000000000002', 'free', 'active')
         RETURNING id`,
      )
    ).rows[0].id;

    const foreignAccess = await requirePool().query(
      `SELECT 1 FROM workspace_members
       WHERE workspace_id = $1 AND clerk_user_id = 'local:00000000-0000-4000-8000-000000000002'`,
      [wsA],
    );
    expect(foreignAccess.rowCount).toBe(0);

    const ownWorkspace = await requirePool().query(
      `SELECT 1 FROM workspaces WHERE id = $1`,
      [wsB],
    );
    expect(ownWorkspace.rowCount).toBe(1);
  });

  it("supports monitor and scan run tables after migration", async () => {
    const tables = await requirePool().query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('monitor_configurations', 'scan_runs', 'monitored_prompts')`,
    );
    const names = tables.rows.map((row: { table_name: string }) => row.table_name);
    expect(names).toContain("monitor_configurations");
    expect(names).toContain("scan_runs");
    expect(names).toContain("monitored_prompts");
  });

  it("verifies required extensions exist", async () => {
    const extensions = await requirePool().query(
      `SELECT extname FROM pg_extension WHERE extname IN ('pgcrypto', 'uuid-ossp')`,
    );
    const names = extensions.rows.map((row: { extname: string }) => row.extname);
    expect(names).toContain("pgcrypto");
  });

  it("reports no pending migrations after setup", async () => {
    const status = await runMigrations({
      pool: requirePool(),
      migrationsDir,
      logger: { log: () => {}, warn: () => {}, error: () => {} },
    });
    expect(status.pending).toBe(0);
  });
});

if (!integrationEnabled) {
  describe("PostgreSQL integration", () => {
    it.skip("requires CITED_INTEGRATION_DATABASE_URL or DATABASE_URL (documented skip for environments without PostgreSQL)", () => {});
  });
}
