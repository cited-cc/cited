#!/usr/bin/env node
import { existsSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();
const required = [
  "lib/jobs/registry.ts",
  "lib/jobs/adapters/worker-loop.ts",
  "scripts/jobs-worker.ts",
  "scripts/jobs-run.ts",
  "docs/open-source/background-jobs.md",
  "tests/jobs-phase10.test.ts",
];

let failed = false;
for (const file of required) {
  if (!existsSync(join(repoRoot, file))) {
    console.error(`Missing scheduler artifact: ${file}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("scheduler:check complete");
