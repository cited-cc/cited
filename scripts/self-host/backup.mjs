#!/usr/bin/env node
import { gzipSync } from "node:zlib";
import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { assertDockerAvailable, BACKUP_DIR, composeEnv, runCompose } from "./lib.mjs";

function main() {
  assertDockerAvailable();
  mkdirSync(BACKUP_DIR, { recursive: true, mode: 0o700 });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `cited-backup-${timestamp}.sql.gz`;
  const hostPath = join(BACKUP_DIR, filename);

  if (existsSync(hostPath)) {
    console.error(`Refusing to overwrite existing backup: ${filename}`);
    process.exit(1);
  }

  const env = composeEnv();
  const database = env.DATABASE_NAME ?? "cited";

  const dump = runCompose(
    [
      "exec",
      "-T",
      "db",
      "pg_dump",
      "-U",
      "postgres",
      "-d",
      database,
      "--no-owner",
      "--format=plain",
    ],
    { stdio: ["ignore", "pipe", "inherit"] },
  );

  if (dump.status !== 0 || !dump.stdout) {
    console.error("Backup failed. Is the stack running?");
    process.exit(dump.status ?? 1);
  }

  writeFileSync(hostPath, gzipSync(Buffer.from(dump.stdout)), { mode: 0o600 });
  try {
    chmodSync(hostPath, 0o600);
  } catch {
    // Best effort.
  }

  console.log(`Backup written to ${hostPath}`);
  console.log("Restore is a deliberate manual procedure. Validate target database before importing.");
}

main();
