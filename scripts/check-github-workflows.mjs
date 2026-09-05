#!/usr/bin/env node
/**
 * Static workflow security checker for fork-safe CI definitions.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

const repoRoot = process.cwd();
const workflowsDir = join(repoRoot, ".github", "workflows");
const findings = [];

function add(ruleId, path, message) {
  findings.push({ ruleId, path, message });
}

function listWorkflowFiles() {
  try {
    return readdirSync(workflowsDir)
      .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
      .map((name) => join(workflowsDir, name));
  } catch {
    add("workflows-dir-missing", ".github/workflows", "Workflow directory is missing.");
    return [];
  }
}

function collectUsesNodes(node, filePath, acc = []) {
  if (!node || typeof node !== "object") {
    return acc;
  }
  if (typeof node.uses === "string") {
    acc.push({ uses: node.uses, filePath });
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        collectUsesNodes(item, filePath, acc);
      }
    } else if (value && typeof value === "object") {
      collectUsesNodes(value, filePath, acc);
    }
  }
  return acc;
}

function walkStrings(node, visitor) {
  if (typeof node === "string") {
    visitor(node);
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      walkStrings(item, visitor);
    }
    return;
  }
  if (node && typeof node === "object") {
    for (const value of Object.values(node)) {
      walkStrings(value, visitor);
    }
  }
}

function checkWorkflowFile(filePath) {
  const relative = filePath.replace(`${repoRoot}/`, "");
  const content = readFileSync(filePath, "utf8");
  let doc;
  try {
    doc = parseYaml(content);
  } catch {
    add("workflow-parse-error", relative, "Workflow YAML could not be parsed.");
    return;
  }

  if (doc.on?.pull_request_target) {
    add("pull-request-target", relative, "pull_request_target trigger is forbidden.");
  }

  const permissions = doc.permissions;
  if (permissions === undefined) {
    add("permissions-missing", relative, "Top-level permissions block is required.");
  } else if (permissions !== "read-all" && typeof permissions === "object") {
    const writeScopes = Object.entries(permissions).filter(
      ([, value]) => value === "write" || value === "admin",
    );
    for (const [scope] of writeScopes) {
      if (scope !== "security-events" && scope !== "actions") {
        add("permissions-write", relative, `Unexpected write permission: ${scope}.`);
      }
    }
  }

  for (const [jobName, job] of Object.entries(doc.jobs ?? {})) {
    if (!job["timeout-minutes"]) {
      add("job-timeout-missing", relative, `Job "${jobName}" must define timeout-minutes.`);
    }
  }

  for (const { uses } of collectUsesNodes(doc, relative)) {
    if (uses.startsWith("./")) {
      continue;
    }
    if (!/@[0-9a-f]{40}$/.test(uses)) {
      add("action-pin", relative, `Action must be pinned to full SHA: ${uses}`);
    }
  }

  walkStrings(doc, (value) => {
    if (/\$\{\{\s*github\.event\.issue\.title\s*\}\}/.test(value)) {
      add("expression-injection", relative, "Untrusted expression interpolation detected.");
    }
    if (/curl\s+[^\n|]*\|\s*(?:ba)?sh/.test(value)) {
      add("curl-pipe-sh", relative, "curl | sh pattern is forbidden.");
    }
    if (/secrets\.(?!GITHUB_TOKEN)/.test(value) && /pull_request/.test(content)) {
      add("pr-secret-reference", relative, "Non-default secrets in PR workflows are forbidden.");
    }
  });

  if (/persist-credentials:\s*true/.test(content)) {
    add("persist-credentials", relative, "persist-credentials: true is forbidden.");
  }

  if (/docker\.sock/.test(content) && /mount/i.test(content)) {
    add("docker-socket", relative, "Docker socket mount requires review.");
  }

  if (/\bdeploy\b|\bpublish\b|\bpush:\s*true/.test(content) && /docker/i.test(content)) {
    if (!/Never publish|no publication|build only/i.test(content)) {
      add("publish-step", relative, "Deployment or publication steps require explicit review.");
    }
  }
}

function main() {
  const files = listWorkflowFiles();
  if (files.length === 0) {
    add("no-workflows", ".github/workflows", "No workflow files found.");
  }

  for (const file of files) {
    checkWorkflowFile(file);
  }

  if (findings.length > 0) {
    console.error("workflow:check: FAIL");
    for (const finding of findings) {
      console.error(JSON.stringify({ level: "error", ...finding }));
    }
    process.exit(1);
  }

  console.log(`workflow:check: PASS (${files.length} workflows)`);
}

main();
