#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { validateMigrationDirectory } from "../lib/db/migrations/runner.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(repoRoot, "supabase", "migrations");

function main() {
  const { files, findings } = validateMigrationDirectory(migrationsDir);
  if (findings.length > 0) {
    console.error("db:validate failed:");
    for (const finding of findings) {
      console.error(`- ${finding.filename}: ${finding.message}`);
    }
    process.exit(1);
  }
  console.log(`db:validate ok (${files.length} migrations).`);
}

main();
