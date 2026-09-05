#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { assertSecretPermissions, SECRETS_DIR } from "./lib.mjs";

async function main() {
  const allowNonInteractive = process.env.CITED_TOKEN_ALLOW_NONINTERACTIVE === "true";
  if (!process.stdin.isTTY && !allowNonInteractive) {
    console.error(
      "Refusing to print bootstrap token in non-interactive mode. Set CITED_TOKEN_ALLOW_NONINTERACTIVE=true only in a secure session if you understand the risk.",
    );
    process.exit(1);
  }

  assertSecretPermissions();
  const tokenPath = join(SECRETS_DIR, "bootstrap_token");
  const token = readFileSync(tokenPath, "utf8").trim();

  if (process.stdin.isTTY) {
    const rl = createInterface({ input, output });
    console.log("WARNING: The bootstrap token grants first-owner setup access.");
    console.log("Anyone with this token can create the initial workspace owner.");
    const answer = await rl.question("Type SHOW to display the token: ");
    await rl.close();
    if (answer.trim() !== "SHOW") {
      console.log("Aborted.");
      process.exit(1);
    }
  }

  process.stdout.write(`${token}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
