#!/usr/bin/env node
/**
 * Documentation integrity scaffolding for Phase 14 CI.
 * External link checks are intentionally excluded from PR gating.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, normalize } from "node:path";

const repoRoot = process.cwd();
const findings = [];

function add(ruleId, path, message, level = "error") {
  findings.push({ ruleId, path, message, level });
}

function listMarkdownFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const absolute = join(dir, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) {
      if (entry === "node_modules") continue;
      listMarkdownFiles(absolute, acc);
      continue;
    }
    if (entry.endsWith(".md")) {
      acc.push(absolute);
    }
  }
  return acc;
}

function checkInternalLinks(filePath, content) {
  const relative = filePath.replace(`${repoRoot}/`, "");
  const blockingDoc =
    relative === "README.md" || relative.startsWith("docs/maintainers/");
  const links = [...content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)];
  for (const [, target] of links) {
    if (!target || target.startsWith("http") || target.startsWith("#") || target.startsWith("mailto:")) {
      continue;
    }
    const normalized = target.split("#")[0];
    if (!normalized) continue;
    const resolved = normalize(resolve(dirname(filePath), normalized));
    try {
      statSync(resolved);
    } catch {
      add(
        "broken-relative-link",
        relative,
        `Broken relative link target: ${target}`,
        blockingDoc ? "error" : "warn",
      );
    }
  }
}

function checkReadmeCommands() {
  const readmePath = join(repoRoot, "README.md");
  let readme;
  try {
    readme = readFileSync(readmePath, "utf8");
  } catch {
    add("readme-missing", "README.md", "README.md is missing.");
    return;
  }

  for (const command of ["npm run lint", "npm run typecheck", "npm run test", "npm run ci:check"]) {
    if (!readme.includes(command)) {
      add("readme-command-missing", "README.md", `README should document ${command}.`);
    }
  }
}

function checkEnvExamples() {
  const exampleFiles = [".env.example", ".env.self-hosted.example", ".env.docker.example"];
  const keys = new Set();
  for (const file of exampleFiles) {
    const absolute = join(repoRoot, file);
    try {
      const content = readFileSync(absolute, "utf8");
      for (const line of content.split("\n")) {
        const match = line.match(/^([A-Z0-9_]+)=/);
        if (match) keys.add(match[1]);
      }
    } catch {
      add("env-example-missing", file, "Environment example file is missing.");
    }
  }
  if (!keys.has("CITED_DEPLOYMENT_MODE")) {
    add("env-example-mode", ".env.example", "CITED_DEPLOYMENT_MODE must be documented.");
  }
}

function main() {
  const docs = listMarkdownFiles(join(repoRoot, "docs"));
  for (const file of docs) {
    const content = readFileSync(file, "utf8");
    checkInternalLinks(file, content);
  }

  checkReadmeCommands();
  checkEnvExamples();

  if (findings.length > 0) {
    const blocking = findings.filter((finding) => finding.level === "error");
    for (const finding of findings) {
      console.error(JSON.stringify({ level: finding.level ?? "error", ...finding }));
    }
    if (blocking.length > 0) {
      console.error("docs:integrity: FAIL");
      process.exit(1);
    }
    console.log(`docs:integrity: PASS (${findings.length} warnings in legacy docs)`);
    return;
  }

  console.log("docs:integrity: PASS");
}

main();
