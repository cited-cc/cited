#!/usr/bin/env node
/**
 * Generate a reproducible SBOM from package-lock.json.
 * Output excludes machine-specific paths.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();
const outputDir = join(repoRoot, ".cited", "sbom");
const outputPath = join(outputDir, "sbom.json");

mkdirSync(outputDir, { recursive: true });

let packages = [];
try {
  const lock = JSON.parse(readFileSync(join(repoRoot, "package-lock.json"), "utf8"));
  const lockPackages = lock.packages ?? {};
  for (const [pkgPath, meta] of Object.entries(lockPackages)) {
    if (!meta || typeof meta !== "object") continue;
    packages.push({
      name: (meta.name ?? pkgPath.replace(/^node_modules\//, "")) || "root",
      version: meta.version ?? null,
      resolved: meta.resolved ?? null,
      integrity: meta.integrity ?? null,
      dev: meta.dev ?? false,
    });
  }
  packages.sort((a, b) => a.name.localeCompare(b.name));
} catch {
  console.error("sbom:generate: FAIL");
  console.error(
    JSON.stringify({
      level: "error",
      ruleId: "sbom-lockfile",
      category: "dependency-policy",
      message: "Could not read package-lock.json for SBOM generation.",
    }),
  );
  process.exit(1);
}

const sbom = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  packageManager: "npm",
  rootPackage: JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")).name,
  packageCount: packages.length,
  packages,
};

writeFileSync(outputPath, `${JSON.stringify(sbom, null, 2)}\n`, "utf8");

console.log("sbom:generate: PASS");
console.log(
  JSON.stringify({
    level: "info",
    ruleId: "sbom-written",
    category: "dependency-policy",
    path: ".cited/sbom/sbom.json",
    packageCount: packages.length,
  }),
);
