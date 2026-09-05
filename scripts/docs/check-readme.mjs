#!/usr/bin/env node
/**
 * README structure and claim hygiene checks.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  REPO_ROOT,
  add,
  checkForbiddenClaims,
  checkImageReferences,
  checkMermaidBlocks,
  reportAndExit,
} from "./lib.mjs";

const REQUIRED_SECTIONS = [
  { pattern: /citation monitoring platform/i, id: "positioning", msg: "Canonical positioning sentence required." },
  { pattern: /Quickstart|Quick start/i, id: "quickstart", msg: "Quickstart section required." },
  { pattern: /npm run self-host:up/i, id: "self-host-command", msg: "Primary self-host command required." },
  { pattern: /mock/i, id: "mock-label", msg: "Mock provider must be documented." },
  { pattern: /DataForSEO/i, id: "dataforseo", msg: "DataForSEO BYO credentials must be documented." },
  { pattern: /AGPL/i, id: "license", msg: "AGPL license mention required." },
  { pattern: /cited\.cc/i, id: "managed-link", msg: "Optional managed Cited link required." },
  { pattern: /does not monitor every|selected prompts|supported surfaces/i, id: "scope-truth", msg: "Monitoring scope truth required." },
  { pattern: /```mermaid/i, id: "architecture-diagram", msg: "Mermaid architecture diagram required." },
  { pattern: /docs\/README\.md|Documentation/i, id: "docs-link", msg: "Documentation links required." },
];

const FORBIDDEN_README = [
  { pattern: /git clone https:\/\/github\.com/i, id: "clone-url", msg: "Do not include fake clone URL before Phase 16." },
  { pattern: /docker pull/i, id: "docker-pull", msg: "Do not claim public Docker images yet." },
  { pattern: /⭐|stars?\s+badge/i, id: "star-badge", msg: "Do not include star badges before publication." },
];

function main() {
  const readmePath = join(REPO_ROOT, "README.md");
  if (!existsSync(readmePath)) {
    add("readme-missing", "README.md", "README.md is missing.");
    reportAndExit("readme:check");
    return;
  }

  const content = readFileSync(readmePath, "utf8");
  checkForbiddenClaims(content, "README.md");
  checkImageReferences(readmePath, content);
  checkMermaidBlocks(readmePath, content);

  for (const section of REQUIRED_SECTIONS) {
    if (!section.pattern.test(content)) {
      add(section.id, "README.md", section.msg);
    }
  }

  for (const rule of FORBIDDEN_README) {
    if (rule.pattern.test(content)) {
      add(rule.id, "README.md", rule.msg);
    }
  }

  if (!content.includes("npm run lint") && !content.includes("Quality checks") && !content.includes("docs:check")) {
    add("quality-commands", "README.md", "Quality check commands should be documented or linked.");
  }

  const hasHeroImage =
    /!\[[^\]]*\]\([^)]+\)/.test(content) ||
    /<img[^>]+src=["'][^"']+(png|jpg|webp)["'][^>]*alt=["'][^"']{8,}["']/i.test(content);
  if (!hasHeroImage) {
    add("hero-image", "README.md", "Hero product screenshot required.");
  }

  reportAndExit("readme:check");
}

main();
