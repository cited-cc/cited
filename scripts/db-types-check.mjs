#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = join(repoRoot, "lib", "db", "schema-contract.json");
const typesPath = join(repoRoot, "lib", "db", "types.ts");

function main() {
  const contract = JSON.parse(readFileSync(contractPath, "utf8"));
  const typesSource = readFileSync(typesPath, "utf8");
  const missing = [];

  for (const table of contract.requiredTables) {
    if (!typesSource.includes(`${table}: {`)) {
      missing.push(`table:${table}`);
    }
  }

  for (const rpc of contract.requiredRpcs) {
    if (!typesSource.includes(`${rpc}:`)) {
      missing.push(`rpc:${rpc}`);
    }
  }

  if (missing.length > 0) {
    console.error("db:types:check failed. Missing schema contract entries in lib/db/types.ts:");
    for (const item of missing) {
      console.error(`- ${item}`);
    }
    process.exit(1);
  }

  console.log("db:types:check ok (hand-maintained types match schema contract).");
}

main();
