import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { join } from "node:path";

import {
  getDatabaseProvider,
  resetDatabaseConfigCacheForTests,
} from "@/lib/db/config";
import { redactDatabaseMessage } from "@/lib/db/errors";
import { resetDeploymentCacheForTests } from "@/lib/deployment/mode";

const require = createRequire(import.meta.url);
const {
  listMigrationFiles,
  preprocessMigrationSql,
  validateMigrationDirectory,
} = require("../lib/db/migrations/runner.mjs");

describe("database phase 7", () => {
  it("defaults self-hosted provider to postgres", () => {
    resetDatabaseConfigCacheForTests();
    resetDeploymentCacheForTests();
    process.env.CITED_DEPLOYMENT_MODE = "self_hosted";
    delete process.env.CITED_DATABASE_PROVIDER;
    expect(getDatabaseProvider()).toBe("postgres");
    resetDatabaseConfigCacheForTests();
    resetDeploymentCacheForTests();
  });

  it("rejects cloud deployment mode before database provider resolution", () => {
    resetDatabaseConfigCacheForTests();
    resetDeploymentCacheForTests();
    process.env.CITED_DEPLOYMENT_MODE = "cloud";
    process.env.CITED_DATABASE_PROVIDER = "postgres";
    expect(() => getDatabaseProvider()).toThrow(/community edition/);
    resetDatabaseConfigCacheForTests();
    resetDeploymentCacheForTests();
  });

  it("redacts database URLs in error messages", () => {
    const message = redactDatabaseMessage(
      "connect failed for postgresql://admin:secret@db.example.com:5432/cited",
    );
    expect(message).not.toContain("secret");
    expect(message).toContain("[redacted]");
  });

  it("validates canonical migrations offline", () => {
    const migrationsDir = join(process.cwd(), "supabase", "migrations");
    const { findings } = validateMigrationDirectory(migrationsDir);
    expect(findings).toEqual([]);
    const files = listMigrationFiles(migrationsDir);
    expect(files.length).toBeGreaterThan(0);
  });

  it("wraps service_role grants for portable postgres", () => {
    const sql =
      "grant execute on function public.claim_due_scan_runs(integer, text, integer) to service_role;";
    const processed = preprocessMigrationSql(sql);
    expect(processed).toContain("IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role')");
  });
});

describe("database repositories contract", () => {
  it("exports monitoring and auth repository accessors", async () => {
    const repos = await import("@/lib/db/repositories");
    expect(repos.getDatabaseRepositories().monitoring).toBeDefined();
    expect(repos.getDatabaseRepositories().auth).toBeDefined();
  });
});
