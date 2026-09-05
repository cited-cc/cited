import { chmodSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  buildPostgresConnectionUrl,
  hydrateDatabaseUrlsFromEnv,
} from "../lib/db/build-connection-url.mjs";
import { hydrateSecretFilesFromEnv } from "../lib/env/secret-files.mjs";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("buildPostgresConnectionUrl", () => {
  it("uses migration password for migration URLs when both passwords are configured", () => {
    const dir = mkdtempSync(join(tmpdir(), "cited-db-url-"));
    const ownerPath = join(dir, "owner");
    const runtimePath = join(dir, "runtime");
    writeFileSync(ownerPath, "owner-secret", { mode: 0o600 });
    writeFileSync(runtimePath, "runtime-secret", { mode: 0o600 });
    chmodSync(ownerPath, 0o600);
    chmodSync(runtimePath, 0o600);

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      DATABASE_HOST: "db",
      DATABASE_PORT: "5432",
      DATABASE_NAME: "cited",
      DATABASE_USER: "cited_app",
      DATABASE_MIGRATION_USER: "cited_owner",
      DATABASE_MIGRATION_PASSWORD_FILE: ownerPath,
      DATABASE_PASSWORD_FILE: runtimePath,
    };

    hydrateSecretFilesFromEnv(env);
    process.env = env;

    const migrationUrl = buildPostgresConnectionUrl({
      user: "cited_owner",
      passwordEnvPrefix: "DATABASE_MIGRATION",
    });

    expect(migrationUrl).toContain(encodeURIComponent("owner-secret"));
    expect(migrationUrl).not.toContain(encodeURIComponent("runtime-secret"));
  });

  it("hydrates migration and runtime URLs with distinct passwords", () => {
    const dir = mkdtempSync(join(tmpdir(), "cited-db-url-"));
    const ownerPath = join(dir, "owner");
    const runtimePath = join(dir, "runtime");
    writeFileSync(ownerPath, "owner-secret", { mode: 0o600 });
    writeFileSync(runtimePath, "runtime-secret", { mode: 0o600 });
    chmodSync(ownerPath, 0o600);
    chmodSync(runtimePath, 0o600);

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      DATABASE_HOST: "db",
      DATABASE_MIGRATION_USER: "cited_owner",
      DATABASE_USER: "cited_app",
      DATABASE_MIGRATION_PASSWORD_FILE: ownerPath,
      DATABASE_PASSWORD_FILE: runtimePath,
    };
    delete env.DATABASE_URL;
    delete env.DATABASE_MIGRATION_URL;
    delete env.CITED_E2E_DATABASE_URL;
    delete env.CITED_INTEGRATION_DATABASE_URL;

    hydrateSecretFilesFromEnv(env);
    process.env = env;
    hydrateDatabaseUrlsFromEnv();

    expect(process.env.DATABASE_URL).toContain(encodeURIComponent("runtime-secret"));
    expect(process.env.DATABASE_MIGRATION_URL).toContain(
      encodeURIComponent("owner-secret"),
    );
  });
});
