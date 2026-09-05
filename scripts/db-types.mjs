#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = join(repoRoot, "lib", "db", "schema-contract.json");

function main() {
  const contract = JSON.parse(readFileSync(contractPath, "utf8"));
  console.log(
    JSON.stringify(
      {
        source: "schema-contract",
        tables: contract.requiredTables.length,
        rpcs: contract.requiredRpcs.length,
        extensions: contract.requiredExtensions,
        note: "Hand-maintained schema contract. Run db:types:check in CI.",
      },
      null,
      2,
    ),
  );
}

main();
