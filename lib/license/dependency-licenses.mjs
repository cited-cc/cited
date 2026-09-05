import { readFileSync } from "node:fs";
import { join } from "node:path";

/** @typedef {"permissive" | "copyleft-review" | "review-required" | "disallowed"} LicenseCategory */

/** @typedef {{ name: string; version: string; license: string; category: LicenseCategory; reason: string }} DependencyLicenseFinding */

const PERMISSIVE_LICENSES = new Set([
  "MIT",
  "MIT-0",
  "ISC",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "0BSD",
  "Unlicense",
  "Apache-2.0",
  "Apache-2.0 WITH LLVM-exception",
  "Zlib",
  "CC0-1.0",
  "BlueOak-1.0.0",
  "MPL-2.0",
]);

const DISALLOWED_PATTERNS = [
  { pattern: /\bSSPL\b/i, reason: "Server Side Public License requires manual legal review and is blocked by default." },
  { pattern: /\bBUSL\b/i, reason: "Business Source License is blocked by default." },
  { pattern: /\bBSL\b/i, reason: "Business Source License is blocked by default." },
];

const COPYLEFT_PATTERNS = [
  { pattern: /\bAGPL/i, reason: "AGPL-family license requires copyleft compatibility review." },
  { pattern: /\bGPL(?!.*Library)/i, reason: "GPL-family license requires copyleft compatibility review." },
  { pattern: /\bLGPL/i, reason: "LGPL-family license requires copyleft compatibility review." },
];

const REVIEW_PATTERNS = [
  { pattern: /UNLICENSED/i, reason: "Package declares UNLICENSED." },
  { pattern: /SEE LICENSE/i, reason: "License requires manual inspection of package files." },
  { pattern: /CUSTOM/i, reason: "Custom license requires manual review." },
  { pattern: /SOURCE AVAILABLE/i, reason: "Source-available license requires manual review." },
  { pattern: /BUSINESS SOURCE/i, reason: "Business Source License requires manual review." },
];

/**
 * @param {string} licenseRaw
 * @returns {string[]}
 */
export function normalizeLicenseTokens(licenseRaw) {
  if (!licenseRaw || typeof licenseRaw !== "string") {
    return [];
  }

  return licenseRaw
    .replace(/[()]/g, " ")
    .split(/\s+(?:AND|OR)\s+|\s*,\s*/i)
    .map((token) => token.trim())
    .filter(Boolean);
}

/**
 * @param {string} licenseRaw
 * @returns {{ category: LicenseCategory; reason: string }}
 */
export function classifyLicense(licenseRaw) {
  const tokens = normalizeLicenseTokens(licenseRaw);

  if (tokens.length === 0) {
    return {
      category: "review-required",
      reason: "Missing or empty license declaration in lockfile.",
    };
  }

  for (const token of tokens) {
    for (const rule of DISALLOWED_PATTERNS) {
      if (rule.pattern.test(token)) {
        return { category: "disallowed", reason: rule.reason };
      }
    }
  }

  for (const token of tokens) {
    for (const rule of COPYLEFT_PATTERNS) {
      if (rule.pattern.test(token)) {
        return { category: "copyleft-review", reason: rule.reason };
      }
    }
  }

  for (const token of tokens) {
    if (PERMISSIVE_LICENSES.has(token)) {
      continue;
    }

    for (const rule of REVIEW_PATTERNS) {
      if (rule.pattern.test(token)) {
        return { category: "review-required", reason: rule.reason };
      }
    }

    if (!PERMISSIVE_LICENSES.has(token)) {
      return {
        category: "review-required",
        reason: `Unknown or unclassified license token: ${token}`,
      };
    }
  }

  return {
    category: "permissive",
    reason: "Common permissive license classification (not a legal compatibility determination).",
  };
}

/**
 * @param {Record<string, unknown>} packageJson
 * @returns {string[]}
 */
export function listDirectDependencyNames(packageJson) {
  const names = new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ]);
  return [...names].sort();
}

/**
 * @param {string} dependencyName
 * @param {Record<string, unknown>} lockfile
 * @returns {{ version: string; license: string } | null}
 */
export function resolveDirectDependencyFromLockfile(dependencyName, lockfile) {
  const packages = lockfile.packages;
  if (!packages || typeof packages !== "object") {
    return null;
  }

  const candidates = [
    `node_modules/${dependencyName}`,
    dependencyName,
  ];

  for (const key of candidates) {
    const entry = packages[key];
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const version = typeof entry.version === "string" ? entry.version : "unknown";
    const license =
      typeof entry.license === "string"
        ? entry.license
        : typeof entry.license === "object" && entry.license !== null
          ? JSON.stringify(entry.license)
          : "";

    return { version, license };
  }

  return null;
}

/**
 * @param {object} options
 * @param {Record<string, unknown>} options.packageJson
 * @param {Record<string, unknown>} options.lockfile
 * @param {Record<string, { reason: string }>=} options.allowlist
 */
export function evaluateDependencyLicenses({ packageJson, lockfile, allowlist = {} }) {
  /** @type {DependencyLicenseFinding[]} */
  const findings = [];

  for (const name of listDirectDependencyNames(packageJson)) {
    const resolved = resolveDirectDependencyFromLockfile(name, lockfile);
    const version = resolved?.version ?? "unknown";
    const license = resolved?.license ?? "";
    const classified = classifyLicense(license);

    let category = classified.category;
    let reason = classified.reason;

    if (allowlist[name]) {
      category = "permissive";
      reason = `Allowlisted: ${allowlist[name].reason}`;
    }

    findings.push({ name, version, license: license || "(missing)", category, reason });
  }

  const blocking = findings.filter((finding) => {
    if (allowlist[finding.name]) {
      return false;
    }
    return (
      finding.category === "disallowed" ||
      finding.category === "review-required" ||
      finding.category === "copyleft-review"
    );
  });

  return {
    ok: blocking.length === 0,
    findings,
    blocking,
    review: findings.filter((finding) => finding.category !== "permissive"),
  };
}

/**
 * @param {string} repoRoot
 */
export function runLicenseCheck(repoRoot) {
  const packageJsonPath = join(repoRoot, "package.json");
  const lockfilePath = join(repoRoot, "package-lock.json");
  const allowlistPath = join(repoRoot, "config/license-allowlist.json");

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const lockfile = JSON.parse(readFileSync(lockfilePath, "utf8"));
  const allowlistFile = JSON.parse(readFileSync(allowlistPath, "utf8"));
  const allowlist = allowlistFile.packages ?? {};

  return evaluateDependencyLicenses({ packageJson, lockfile, allowlist });
}
