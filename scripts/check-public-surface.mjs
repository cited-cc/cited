#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();
const manifestPath = join(repoRoot, "config/public-surface.json");

/** @typedef {{ ruleId: string; path: string; message: string }} Violation */

/** @type {Violation[]} */
const violations = [];

function addViolation(ruleId, path, message) {
  violations.push({ ruleId, path, message });
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function exists(path) {
  return existsSync(join(repoRoot, path));
}

function read(path) {
  return readFileSync(join(repoRoot, path), "utf8");
}

function listFiles(dir, acc = []) {
  const absolute = join(repoRoot, dir);
  if (!existsSync(absolute)) return acc;
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next") {
      continue;
    }
    const rel = join(dir, entry.name);
    if (entry.isDirectory()) {
      listFiles(rel, acc);
    } else if (/\.(ts|tsx|js|jsx|mjs|cjs|json|md)$/.test(entry.name)) {
      acc.push(rel);
    }
  }
  return acc;
}

function checkManifest() {
  if (!exists("config/public-surface.json")) {
    addViolation("manifest-missing", "config/public-surface.json", "Public surface manifest is required.");
    return null;
  }
  return readJson(manifestPath);
}

function checkForbiddenDirectories(manifest) {
  for (const dir of manifest.forbiddenDirectories ?? []) {
    if (exists(dir)) {
      addViolation("forbidden-directory-present", dir, "Cloud-only directory must not exist in community distribution.");
    }
  }
}

function checkForbiddenRoutes(manifest) {
  for (const route of manifest.forbiddenRoutes ?? []) {
    if (exists(route)) {
      addViolation("forbidden-route-present", route, "Cloud-only route must not exist in community distribution.");
    }
  }
}

function checkForbiddenDependencies(manifest) {
  const pkg = readJson(join(repoRoot, "package.json"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const dep of manifest.forbiddenDependencies ?? []) {
    if (deps[dep]) {
      addViolation("forbidden-dependency-present", "package.json", `Forbidden dependency "${dep}" must be removed.`);
    }
  }
}

function checkForbiddenEnvInExamples(manifest) {
  for (const file of [".env.example", ".env.self-hosted.example", ".env.docker.example"]) {
    if (!exists(file)) continue;
    const content = read(file);
    for (const prefix of manifest.forbiddenEnvPrefixes ?? []) {
      const regex = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m");
      if (regex.test(content)) {
        addViolation("forbidden-env-documented", file, `Forbidden environment prefix "${prefix}" must not appear in public env examples.`);
      }
    }
  }
}

function checkForbiddenImports(manifest) {
  const scanExtensions = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
  const files = listFiles(".").filter((filePath) => scanExtensions.test(filePath));
  const forbiddenDeps = manifest.forbiddenDependencies ?? [];
  const importPatterns = [
    ...forbiddenDeps.filter((dep) => dep.includes("/") || dep.startsWith("@")),
    "lib/billing/",
    "lib/chatbot/",
    "lib/scan/",
    "lib/launch/",
    "lib/integrations/",
    "@clerk/",
  ];

  const moduleImportRegexes = [
    /from\s+["']@clerk\//,
    /from\s+["']stripe["']/,
    /from\s+["']resend["']/,
    /from\s+["']svix["']/,
    /from\s+["']@vercel\/analytics/,
    /from\s+["']@datafast\//,
    /from\s+["']@ai-sdk\//,
    /from\s+["']ai["']/,
    /require\(\s*["']@clerk\//,
    /require\(\s*["']stripe["']/,
    /require\(\s*["']resend["']/,
    /require\(\s*["']ai["']/,
    /import\(\s*["']@clerk\//,
    /import\(\s*["']stripe["']/,
    /import\(\s*["']resend["']/,
    /import\(\s*["']ai["']/,
    /["']@\/lib\/billing\//,
    /["']@\/lib\/chatbot\//,
    /["']@\/lib\/scan\//,
    /["']@\/lib\/launch\//,
    /["']@\/lib\/integrations\//,
  ];

  for (const filePath of files) {
    if (
      filePath.startsWith("tests/") ||
      filePath.includes("check-public-surface") ||
      filePath.startsWith("scripts/check-")
    ) {
      continue;
    }
    const content = read(filePath);
    for (const regex of moduleImportRegexes) {
      if (regex.test(content)) {
        addViolation(
          "forbidden-import",
          filePath,
          `References forbidden module import matching ${regex}.`,
        );
      }
    }
    for (const pattern of importPatterns) {
      if (pattern.includes("/") && content.includes(pattern)) {
        addViolation("forbidden-import", filePath, `References forbidden module pattern "${pattern}".`);
      }
    }
    if (/\/checkout\b/.test(content)) {
      if (content.includes('"/checkout') || content.includes("'/checkout") || content.includes("`/checkout")) {
        addViolation("checkout-path-reference", filePath, "Checkout path references must not remain in community distribution.");
      }
    }
  }
}

function checkRequiredDocumentation(manifest) {
  for (const doc of manifest.requiredDocumentation ?? []) {
    if (!exists(doc)) {
      addViolation("required-doc-missing", doc, "Required public documentation is missing.");
    }
  }
}

function checkRequiredAssets(manifest) {
  for (const asset of manifest.requiredAssets ?? []) {
    if (!exists(asset)) {
      addViolation("required-asset-missing", asset, "Required public asset is missing.");
    }
  }
}

function checkNpmScripts(manifest) {
  const pkg = readJson(join(repoRoot, "package.json"));
  for (const scriptName of manifest.publicCommands ?? []) {
    if (!pkg.scripts?.[scriptName]) {
      addViolation("missing-npm-script", "package.json", `Required npm script "${scriptName}" is missing.`);
      continue;
    }
    const command = pkg.scripts[scriptName];
    for (const forbidden of ["datafast", "resend-inbound", "sync-datafast"]) {
      if (command.includes(forbidden)) {
        addViolation("forbidden-script-target", "package.json", `Script "${scriptName}" references removed cloud tooling.`);
      }
    }
  }
}

function checkDeploymentMode() {
  const modeFile = read("lib/deployment/mode.ts");
  if (!modeFile.includes("community edition")) {
    addViolation("cloud-mode-guard-missing", "lib/deployment/mode.ts", "Community edition must reject cloud deployment mode.");
  }
}

function checkGitRemote() {
  try {
    const policy = JSON.parse(read("config/publication-policy.json"));
    if (policy.publicReleaseBlocked === false) {
      return;
    }
  } catch {
    // Fall through to remote check when policy is unavailable.
  }

  try {
    const remotes = execFileSync("git", ["-C", repoRoot, "remote"], { encoding: "utf8" }).trim();
    if (remotes) {
      addViolation("git-remote-present", ".git/config", "Community staging must not configure git remotes before publication.");
    }
  } catch {
    // No git or no remotes is acceptable.
  }
}

function main() {
  const manifest = checkManifest();
  if (!manifest) {
    reportAndExit();
    return;
  }

  checkForbiddenDirectories(manifest);
  checkForbiddenRoutes(manifest);
  checkForbiddenDependencies(manifest);
  checkForbiddenEnvInExamples(manifest);
  checkForbiddenImports(manifest);
  checkRequiredDocumentation(manifest);
  checkRequiredAssets(manifest);
  checkNpmScripts(manifest);
  checkDeploymentMode();
  checkGitRemote();

  reportAndExit();
}

function reportAndExit() {
  if (violations.length === 0) {
    console.log("Public surface check passed.");
    process.exit(0);
  }

  console.error(`Public surface check failed with ${violations.length} violation(s):`);
  for (const violation of violations) {
    console.error(`- [${violation.ruleId}] ${violation.path}: ${violation.message}`);
  }
  process.exit(1);
}

main();
