#!/usr/bin/env node
/**
 * Documentation structure and quality checks for Phase 15.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  REPO_ROOT,
  add,
  listMarkdownFiles,
  checkInternalLinks,
  checkImageReferences,
  checkMermaidBlocks,
  checkForbiddenClaims,
  reportAndExit,
} from "./lib.mjs";

const REQUIRED_DOCS = [
  "docs/README.md",
  "docs/getting-started/quickstart.md",
  "docs/getting-started/first-run-setup.md",
  "docs/getting-started/configuration.md",
  "docs/getting-started/manual-installation.md",
  "docs/getting-started/first-monitor.md",
  "docs/concepts/how-cited-works.md",
  "docs/concepts/prompts-and-surfaces.md",
  "docs/concepts/citations-and-mentions.md",
  "docs/concepts/competitors.md",
  "docs/concepts/evidence-ledger.md",
  "docs/concepts/monitoring-lifecycle.md",
  "docs/providers/overview.md",
  "docs/providers/dataforseo.md",
  "docs/providers/mock.md",
  "docs/providers/building-an-adapter.md",
  "docs/operations/docker.md",
  "docs/operations/worker.md",
  "docs/operations/notifications.md",
  "docs/operations/backups.md",
  "docs/operations/upgrades.md",
  "docs/operations/retention.md",
  "docs/operations/troubleshooting.md",
  "docs/reference/environment-variables.md",
  "docs/reference/commands.md",
  "docs/reference/api.md",
  "docs/reference/feature-matrix.md",
  "docs/reference/architecture.md",
];

const STALE_CLOUD_PATTERNS = [
  { pattern: /app\/api\/billing/i, msg: "Stale Cloud billing route reference." },
  { pattern: /app\/api\/webhooks\/stripe/i, msg: "Stale Stripe webhook reference." },
  { pattern: /app\/api\/webhooks\/clerk/i, msg: "Stale Clerk webhook reference in user docs." },
];

function checkRequiredDocs() {
  for (const docPath of REQUIRED_DOCS) {
    if (!existsSync(join(REPO_ROOT, docPath))) {
      add("docs-structure-missing", docPath, "Required documentation file is missing.");
    }
  }
}

function checkDocsIndex() {
  const indexPath = "docs/README.md";
  if (!existsSync(join(REPO_ROOT, indexPath))) return;
  const content = readFileSync(join(REPO_ROOT, indexPath), "utf8");
  for (const section of ["getting-started", "concepts", "providers", "operations", "security", "reference", "maintainers"]) {
    if (!content.includes(section)) {
      add("docs-index-section", indexPath, `Documentation index should link to ${section}.`);
    }
  }
}

function scanMarkdownFiles() {
  const files = [
    join(REPO_ROOT, "README.md"),
    ...listMarkdownFiles(join(REPO_ROOT, "docs")),
    join(REPO_ROOT, "CONTRIBUTING.md"),
    join(REPO_ROOT, "CHANGELOG.md"),
    join(REPO_ROOT, "ROADMAP.md"),
    join(REPO_ROOT, "SUPPORT.md"),
  ].filter((file) => existsSync(file));

  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const rel = file.replace(`${REPO_ROOT}/`, "");
    checkInternalLinks(file, content);
    checkImageReferences(file, content);
    checkMermaidBlocks(file, content);
    checkForbiddenClaims(content, rel);

    if (rel.startsWith("docs/") && !rel.includes("open-source/fresh-history")) {
      for (const rule of STALE_CLOUD_PATTERNS) {
        if (rule.pattern.test(content)) {
          add("stale-cloud-reference", rel, rule.msg, "warn");
        }
      }
    }

    if (/Phase \d+ (complete|foundation)/i.test(content) && !rel.includes("maintainers/") && !rel.includes("open-source/publication") && rel !== "ROADMAP.md") {
      add("phase-note-in-user-doc", rel, "Remove stale implementation-phase notes from user-facing docs.", "warn");
    }
  }
}

function main() {
  checkRequiredDocs();
  checkDocsIndex();
  scanMarkdownFiles();
  reportAndExit("docs:check");
}

main();
