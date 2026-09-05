#!/usr/bin/env node
import { mkdirSync } from "node:fs";

import {
  assertDockerAvailable,
  ensureConfigFile,
  gitHasRemote,
  isPublicationBlocked,
  SECRET_DEFINITIONS,
  SECRETS_DIR,
  writeSecretFile,
} from "./lib.mjs";

function main() {
  if (isPublicationBlocked() && gitHasRemote()) {
    console.error("Refusing to initialize: unexpected Git remote is configured.");
    process.exit(1);
  }

  assertDockerAvailable();
  mkdirSync(SECRETS_DIR, { recursive: true, mode: 0o700 });
  ensureConfigFile();

  let created = 0;
  for (const secret of SECRET_DEFINITIONS) {
    try {
      writeSecretFile(secret.name, secret.bytes);
      created += 1;
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("Refusing to overwrite")) {
        throw error;
      }
    }
  }

  console.log("Self-host initialization complete.");
  console.log(`Secrets directory: ${SECRETS_DIR}`);
  console.log(`Created ${created} new secret file(s). Existing secrets were preserved.`);
  console.log("Defaults: mock monitoring provider, notifications disabled.");
  console.log("Next: npm run self-host:up");
}

main();
