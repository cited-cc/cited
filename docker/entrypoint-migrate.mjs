#!/usr/bin/env node
import { hydrateSecretFilesFromEnv } from "../lib/env/secret-files.mjs";
import { hydrateDatabaseUrlsFromEnv } from "../lib/db/build-connection-url.mjs";

hydrateSecretFilesFromEnv();
hydrateDatabaseUrlsFromEnv();

const { initDatabaseRoles } = await import("../scripts/db-init-roles.mjs");
await initDatabaseRoles();

const { runDatabaseMigrations } = await import("../scripts/db-migrate.mjs");
await runDatabaseMigrations();
