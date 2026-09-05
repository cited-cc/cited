#!/usr/bin/env node
import { hydrateSecretFilesFromEnv } from "../lib/env/secret-files.mjs";
import { hydrateDatabaseUrlsFromEnv } from "../lib/db/build-connection-url.mjs";

hydrateSecretFilesFromEnv();
hydrateDatabaseUrlsFromEnv();

await import("../server.js");
