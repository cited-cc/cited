#!/usr/bin/env node
/**
 * npm script documentation drift check.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  REPO_ROOT,
  add,
  extractPackageScripts,
  reportAndExit,
} from "./lib.mjs";

const COMMANDS_DOC = "docs/reference/commands.md";

function main() {
  const scripts = extractPackageScripts();
  const content = readFileSync(join(REPO_ROOT, COMMANDS_DOC), "utf8");

  for (const script of scripts) {
    if (!content.includes(`npm run ${script}`) && !content.includes(`\`${script}\``)) {
      add("command-undocumented", COMMANDS_DOC, `npm script "${script}" is not documented.`);
    }
  }

  const documentedCommands = [...content.matchAll(/`npm run ([a-z0-9:_-]+)`/g)].map((m) => m[1]);
  for (const command of documentedCommands) {
    if (!scripts.includes(command)) {
      add("command-stale-doc", COMMANDS_DOC, `Documented command "${command}" is not in package.json.`, "warn");
    }
  }

  reportAndExit("commands:drift");
}

main();
