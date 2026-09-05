#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();
const required = [
  "lib/notifications/providers/registry.ts",
  "lib/notifications/providers/smtp.ts",
  "lib/notifications/providers/disabled.ts",
  "tests/notifications-providers.test.ts",
];

let failed = false;
for (const file of required) {
  if (!existsSync(join(repoRoot, file))) {
    console.error(`Missing notifications artifact: ${file}`);
    failed = true;
  }
}

const disabledPath = join(repoRoot, "lib/notifications/providers/disabled.ts");
if (existsSync(disabledPath)) {
  const disabled = readFileSync(disabledPath, "utf8");
  if (disabled.includes("hooks.slack.com")) {
    console.error("Disabled provider must not call external Slack endpoints.");
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("notifications:check complete");
