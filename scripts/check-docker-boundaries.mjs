#!/usr/bin/env node
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();
const violations = [];

function add(ruleId, path, message) {
  violations.push({ ruleId, path, message });
}

function read(path) {
  return readFileSync(join(repoRoot, path), "utf8");
}

function exists(path) {
  try {
    statSync(join(repoRoot, path));
    return true;
  } catch {
    return false;
  }
}

function scanForSecrets(content, path) {
  const patterns = [
    /password\s*[:=]\s*['"]?[A-Za-z0-9+/=_-]{8,}/i,
    /postgresql:\/\/[^\s'"]+:[^\s'"]+@/i,
    /sk_live_/,
    /re_[A-Za-z0-9]{20,}/,
  ];
  for (const pattern of patterns) {
    if (pattern.test(content)) {
      add("embedded-secret", path, "Possible secret or credential pattern detected.");
      break;
    }
  }
}

// .dockerignore coverage
const dockerignore = read(".dockerignore");
for (const required of [".git", ".env", ".cited/", "node_modules", ".next", "research/"]) {
  if (!dockerignore.includes(required)) {
    add("dockerignore-missing", ".dockerignore", `Expected ignore entry: ${required}`);
  }
}

// Secret directory gitignored
const gitignore = read(".gitignore");
if (!gitignore.includes(".cited")) {
  add("gitignore-cited-missing", ".gitignore", ".cited/ must be gitignored.");
}

// Compose and Dockerfile scans
for (const file of ["docker-compose.yml", "Dockerfile", ".env.docker.example"]) {
  if (!exists(file)) {
    add("docker-file-missing", file, "Required Docker artifact is missing.");
    continue;
  }
  const content = read(file);
  scanForSecrets(content, file);
  if (/privileged:\s*true/i.test(content)) {
    add("privileged-mode", file, "Privileged mode must not be enabled.");
  }
  if (content.includes("/var/run/docker.sock")) {
    add("docker-socket-mount", file, "Docker socket mount is forbidden.");
  }
}

const compose = exists("docker-compose.yml") ? read("docker-compose.yml") : "";
const dbSection = compose.split(/^  web:/m)[0] ?? "";
if (dbSection.includes("  db:") && /\n    ports:\n/m.test(dbSection)) {
  add("db-host-port", "docker-compose.yml", "Database must not publish host ports by default.");
}
const workerSection = compose.match(/^  worker:[\s\S]*?(?=^  [a-z]|^secrets:|^networks:|^volumes:|$)/m)?.[0] ?? "";
if (workerSection && /\n    ports:\n/m.test(workerSection)) {
  add("worker-port", "docker-compose.yml", "Worker must not expose public ports.");
}
if (!compose.includes("healthcheck")) {
  add("healthcheck-missing", "docker-compose.yml", "Health checks are required.");
}
if (!compose.includes("read_only: true")) {
  add("readonly-root-missing", "docker-compose.yml", "Web/worker should use read-only root where compatible.");
}
if (!compose.includes("no-new-privileges:true")) {
  add("no-new-privileges-missing", "docker-compose.yml", "no-new-privileges security option is required.");
}
if (!compose.includes("CITED_MONITORING_PROVIDER: ${CITED_MONITORING_PROVIDER:-mock}")) {
  add("default-mock-provider", "docker-compose.yml", "Default monitoring provider must be mock.");
}
if (!compose.includes("NOTIFICATIONS_ENABLED: ${NOTIFICATIONS_ENABLED:-false}")) {
  add("notifications-disabled-default", "docker-compose.yml", "Notifications must default to disabled.");
}

const dockerfile = exists("Dockerfile") ? read("Dockerfile") : "";
if (dockerfile && !dockerfile.includes("node:22-bookworm-slim")) {
  add("dockerfile-base-pin", "Dockerfile", "Dockerfile must use an explicit Node 22 base image tag.");
}
if (dockerfile && !dockerfile.includes("USER cited")) {
  add("dockerfile-non-root", "Dockerfile", "Runtime image must run as non-root.");
}
if (dockerfile && !dockerfile.includes("LICENSE")) {
  add("dockerfile-license", "Dockerfile", "LICENSE must be included in runtime image.");
}

const downScript = exists("scripts/self-host/down.mjs") ? read("scripts/self-host/down.mjs") : "";
if (downScript.includes("--volumes")) {
  add("down-deletes-volumes", "scripts/self-host/down.mjs", "self-host:down must not delete volumes.");
}

for (const script of [
  "scripts/self-host/init.mjs",
  "scripts/self-host/up.mjs",
  "scripts/self-host/token.mjs",
  "scripts/db-init-roles.mjs",
  "scripts/check-docker-boundaries.mjs",
]) {
  if (!exists(script)) {
    add("self-host-script-missing", script, "Required self-host script is missing.");
  }
}

if (violations.length > 0) {
  console.error("Docker boundary check failed:");
  for (const violation of violations) {
    console.error(`- [${violation.ruleId}] ${violation.path}: ${violation.message}`);
  }
  process.exit(1);
}

console.log("Docker boundary check passed.");
