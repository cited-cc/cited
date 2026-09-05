#!/usr/bin/env tsx
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  allProviderTaskPhases,
  transitionsFromProviderPhase,
} from "@/lib/monitoring/provider-task-state";
import {
  resolveMonitoringOperationalLimits,
  validateOperationalLimits,
} from "@/lib/monitoring/limits";
import {
  allScanPhases as scanPhases,
  transitionsFromPhase as scanTransitions,
} from "@/lib/monitoring/state-machine";
import { CLASSIFICATION_CONTRACT } from "@/lib/classification/contract";

const args = process.argv.slice(2);

if (args.includes("--live")) {
  console.error(
    "monitoring:doctor --live is blocked in Phase 9. Use mock provider diagnostics only.",
  );
  process.exit(1);
}

console.log("Cited monitoring doctor (offline)\n");

const limits = resolveMonitoringOperationalLimits();
const limitErrors = validateOperationalLimits(limits);
if (limitErrors.length > 0) {
  console.error("Operational limit validation failed:");
  for (const err of limitErrors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}
console.log("Operational limits: ok");

console.log(`Scan phases: ${scanPhases().length}`);
for (const phase of scanPhases()) {
  const next = scanTransitions(phase);
  console.log(`  ${phase} -> [${next.join(", ")}]`);
}

console.log(`Provider task phases: ${allProviderTaskPhases().length}`);
for (const phase of allProviderTaskPhases()) {
  console.log(`  ${phase} -> [${transitionsFromProviderPhase(phase).join(", ")}]`);
}

console.log(`Classification version: ${CLASSIFICATION_CONTRACT.version}`);

const migrationPath =
  "supabase/migrations/20260904190000_cited_phase9_monitoring_lifecycle.sql";
if (!existsSync(join(process.cwd(), migrationPath))) {
  console.error(`Missing migration: ${migrationPath}`);
  process.exit(1);
}
console.log("Phase 9 migration present: ok");

const executeSource = readFileSync(
  join(process.cwd(), "lib/monitoring/execute-scan-run.ts"),
  "utf8",
);
if (executeSource.includes("competitorHostnames: []")) {
  console.error("Competitor wiring regression detected in execute-scan-run.ts");
  process.exit(1);
}
console.log("Competitor wiring: ok");

try {
  execFileSync("node", ["scripts/check-monitoring-boundaries.mjs"], {
    stdio: "pipe",
  });
  console.log("Boundary checks: ok");
} catch {
  console.error("Boundary checks failed");
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL;
if (dbUrl && !dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1")) {
  console.log("Remote database URL detected: skipping schema probe (Phase 9 safety).");
} else if (dbUrl) {
  console.log("Local database URL detected: schema probe not required for Phase 9 doctor.");
} else {
  console.log("No local database URL: schema probe skipped.");
}

console.log("\nmonitoring:doctor ok (mock/offline mode)");
