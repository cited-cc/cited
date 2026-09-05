#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
if (args.includes("--live")) {
  console.error("monitoring:check: --live is not supported in Phase 9.");
  process.exit(1);
}

execFileSync("node", ["scripts/check-monitoring-boundaries.mjs"], {
  stdio: "inherit",
});

console.log("monitoring:check complete");
