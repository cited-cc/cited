#!/usr/bin/env node
/**
 * Environment variable documentation drift check.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  REPO_ROOT,
  add,
  extractEnvKeysFromExamples,
  extractDocumentedEnvKeys,
  reportAndExit,
} from "./lib.mjs";

const ENV_DOC = "docs/reference/environment-variables.md";

const CLOUD_ONLY_PREFIXES = [
  "CLERK_",
  "NEXT_PUBLIC_CLERK_",
  "STRIPE_",
  "BILLING_",
  "RESEND_",
  "INBOUND_MAIL_",
  "FREE_SCAN_",
  "NEXT_PUBLIC_FREE_SCAN_",
  "NEXT_PUBLIC_CITED_CHATBOT_",
  "DATAFAST_",
  "LEARN_DOMAINS_",
  "NEXT_PUBLIC_LAUNCH_",
  "NEXT_PUBLIC_PRODUCT_HUNT_",
  "AI_GATEWAY_",
  "ANTHROPIC_",
  "SENTRY_",
];

function isCloudOnly(key) {
  return CLOUD_ONLY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function main() {
  const exampleKeys = extractEnvKeysFromExamples();
  const documented = extractDocumentedEnvKeys(ENV_DOC);

  for (const key of exampleKeys) {
    if (isCloudOnly(key)) continue;
    if (!documented.has(key)) {
      add("env-undocumented", ENV_DOC, `Environment variable ${key} is in examples but not documented.`);
    }
  }

  for (const key of documented) {
    if (!exampleKeys.has(key) && !key.endsWith("_FILE")) {
      add("env-stale-doc", ENV_DOC, `Documented variable ${key} is not present in env examples.`, "warn");
    }
  }

  const envDoc = readFileSync(join(REPO_ROOT, ENV_DOC), "utf8");
  if (!envDoc.includes("_FILE")) {
    add("env-file-support", ENV_DOC, "Document *_FILE secret file support.");
  }

  reportAndExit("env:drift");
}

main();
