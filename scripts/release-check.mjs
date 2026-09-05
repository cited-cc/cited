#!/usr/bin/env node

import { spawnSync } from "node:child_process";

import {
  TARGET_TAG,
  TARGET_VERSION,
  collectReleaseViolations,
  getGitStatus,
} from "../lib/release/release.mjs";

const repoRoot = process.cwd();
const mode = process.env.CITED_RELEASE_MODE === "release" ? "release" : "candidate";

const CI_STAGES = [
  "workflow:check",
  "docs:check",
  "readme:check",
  "assets:check",
  "docs:links",
  "test:all",
  "test:coverage",
  "test:e2e",
  "security:scan",
  "security:check",
  "security:audit",
  "license:check",
  "sbom:generate",
  "public-surface:check",
  "docker:check",
  "scheduler:check",
  "notifications:check",
  "monitoring:check",
  "provider:check",
  "database:check",
  "auth:check",
  "deployment:check",
  "lint",
  "typecheck",
  "test",
  "content:check",
  "seo:check",
  "build",
  "db:migration-ci",
  "self-host:smoke",
];

/** @type {{ ruleId: string; message: string; path: string }[]} */
const violations = [];

function runStage(scriptName) {
  const result = spawnSync("npm", ["run", scriptName], {
    cwd: repoRoot,
    env: { ...process.env, TZ: "UTC", FORCE_COLOR: "0" },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    violations.push({
      ruleId: "ci-stage-failed",
      path: "package.json",
      message: `Required release gate "${scriptName}" failed.`,
    });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  } else {
    console.log(`[PASS] ${scriptName}`);
  }
}

function main() {
  console.error(`release:check starting (mode=${mode}, version=${TARGET_VERSION}, tag=${TARGET_TAG})`);

  const status = getGitStatus(repoRoot);
  console.error(
    JSON.stringify({
      level: "info",
      branch: status.branch,
      head: status.head,
      commitCount: status.commitCount,
      remotes: status.remotes,
      tags: status.tags,
      dirty: status.dirty,
    }),
  );

  for (const stage of CI_STAGES) {
    runStage(stage);
  }

  violations.push(...collectReleaseViolations(repoRoot, { mode }));

  const diffCheck = spawnSync("git", ["diff", "--check"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (diffCheck.status !== 0) {
    violations.push({
      ruleId: "whitespace-errors",
      path: ".",
      message: "git diff --check reported whitespace errors.",
    });
  }

  if (status.dirty) {
    console.error("git status --short:");
    console.error(status.porcelain);
  }

  if (violations.length > 0) {
    console.error(`release:check: FAIL (${violations.length} violations)`);
    for (const violation of violations) {
      console.error(
        JSON.stringify({
          level: "error",
          ruleId: violation.ruleId,
          path: violation.path,
          message: violation.message,
        }),
      );
    }
    process.exit(1);
  }

  console.error("release:check: PASS");
}

main();
