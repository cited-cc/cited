#!/usr/bin/env node
/**
 * Local CI parity runner. Deterministic checks only. No GitHub required.
 */
import { spawnSync } from "node:child_process";

process.env.TZ = "UTC";
process.on("unhandledRejection", () => process.exit(1));

const repoRoot = process.cwd();
const stages = [];
let failed = false;

function runStage(name, command, args, options = {}) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    env: { ...process.env, TZ: "UTC", FORCE_COLOR: "0" },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  const durationMs = Date.now() - started;
  const ok = result.status === 0;
  if (!ok && !options.allowFail) {
    failed = true;
  }
  stages.push({
    name,
    ok,
    durationMs,
    skipped: Boolean(options.skipped),
    note: options.note,
  });
  const status = options.skipped ? "SKIP" : ok ? "PASS" : options.allowFail ? "WARN" : "FAIL";
  console.log(`[${status}] ${name} (${durationMs}ms)`);
  if (!ok && !options.allowFail && !options.skipped) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }
  return ok;
}

function hasPostgres() {
  return Boolean(
    process.env.CITED_INTEGRATION_DATABASE_URL?.trim() ||
      process.env.DATABASE_URL?.trim(),
  );
}

function hasDocker() {
  return spawnSync("docker", ["version"], { stdio: "ignore" }).status === 0;
}

function main() {
  console.log("ci:check starting (UTC, local parity)");

  runStage("workflow:check", "npm", ["run", "workflow:check"]);
  runStage("lint", "npm", ["run", "lint"]);
  runStage("typecheck", "npm", ["run", "typecheck"]);
  runStage("test:unit", "npm", ["run", "test:unit"]);
  runStage("test:security", "npm", ["run", "test:security"]);
  runStage("test:boundary", "npm", ["run", "test:boundary"]);

  if (hasPostgres()) {
    runStage("test:integration", "npm", ["run", "test:integration"]);
    runStage("db:migration-ci", "npm", ["run", "db:migration-ci"]);
  } else {
    runStage("test:integration", "node", ["-e", "process.exit(0)"], {
      skipped: true,
      note: "Requires DATABASE_URL or CITED_INTEGRATION_DATABASE_URL",
    });
    runStage("db:migration-ci", "node", ["-e", "process.exit(0)"], {
      skipped: true,
      note: "Requires PostgreSQL admin URL",
    });
  }

  runStage("test:coverage", "npm", ["run", "test:coverage"]);
  runStage("security:scan", "npm", ["run", "security:scan"]);
  runStage("security:check", "npm", ["run", "security:check"]);
  runStage("security:audit", "npm", ["run", "security:audit"], { allowFail: true });
  runStage("license:check", "npm", ["run", "license:check"]);
  runStage("sbom:generate", "npm", ["run", "sbom:generate"]);
  runStage("public-surface:check", "npm", ["run", "public-surface:check"]);
  runStage("publication:check", "npm", ["run", "publication:check"], { allowFail: true });
  runStage("test-fixtures:check", "npm", ["run", "test-fixtures:check"]);
  runStage("docs:integrity", "npm", ["run", "docs:integrity"]);
  runStage("docs:check", "npm", ["run", "docs:check"]);
  runStage("readme:check", "npm", ["run", "readme:check"]);
  runStage("assets:check", "npm", ["run", "assets:check"]);
  runStage("docs:links", "npm", ["run", "docs:links"]);
  runStage("env:drift", "npm", ["run", "env:drift"]);
  runStage("commands:drift", "npm", ["run", "commands:drift"]);
  runStage("docs-a11y", "npm", ["run", "test", "--", "tests/docs/accessibility.test.ts"]);
  runStage("docker:check", "npm", ["run", "docker:check"]);
  runStage("scheduler:check", "npm", ["run", "scheduler:check"]);
  runStage("notifications:check", "npm", ["run", "notifications:check"]);
  runStage("monitoring:check", "npm", ["run", "monitoring:check"]);
  runStage("provider:check", "npm", ["run", "provider:check"]);
  runStage("database:check", "npm", ["run", "database:check"]);
  runStage("auth:check", "npm", ["run", "auth:check"]);
  runStage("deployment:check", "npm", ["run", "deployment:check"]);
  runStage("content:check", "npm", ["run", "content:check"]);
  runStage("seo:check", "npm", ["run", "seo:check"]);
  runStage("build", "npm", ["run", "build"]);

  if (process.env.CITED_E2E_ENABLED === "true" && hasPostgres()) {
    runStage("test:e2e", "npm", ["run", "test:e2e"]);
  } else {
    runStage("test:e2e", "node", ["-e", "process.exit(0)"], {
      skipped: true,
      note: "Set CITED_E2E_ENABLED=true with DATABASE_URL and run npm run build first",
    });
  }

  if (hasDocker()) {
    runStage("docker:smoke", "npm", ["run", "self-host:smoke"]);
  } else {
    runStage("docker:smoke", "node", ["-e", "process.exit(0)"], {
      skipped: true,
      note: "Requires local Docker daemon",
    });
  }

  console.log("\nci:check summary:");
  for (const stage of stages) {
    const status = stage.skipped ? "SKIP" : stage.ok ? "PASS" : "FAIL";
    console.log(`- ${status} ${stage.name}${stage.note ? ` (${stage.note})` : ""}`);
  }

  if (failed) {
    console.error("\nci:check: FAIL");
    process.exit(1);
  }

  console.log("\nci:check: PASS");
}

main();
