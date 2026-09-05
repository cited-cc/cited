import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/** @typedef {"blocking" | "warning"} FindingSeverity */
/** @typedef {{ ruleId: string; category: string; severity: FindingSeverity; path: string; message: string }} Finding */

const TEXT_FILE_PATTERN =
  /\.(ts|tsx|js|jsx|mjs|cjs|json|md|yml|yaml|toml|txt|csv|sh|py|sql|env\.example)$/i;

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @param {string} policyPath
 */
export function readPolicyFile(policyPath) {
  const raw = readFileSync(policyPath, "utf8");
  return JSON.parse(raw);
}

/**
 * @param {unknown} policy
 */
export function validatePolicyShape(policy) {
  if (!isObject(policy)) {
    throw new Error("Policy must be a JSON object.");
  }

  const requiredStringFields = ["repository", "defaultVisibility"];
  for (const field of requiredStringFields) {
    if (typeof policy[field] !== "string" || policy[field].length === 0) {
      throw new Error(`Policy field "${field}" must be a non-empty string.`);
    }
  }

  const schemaVersion = policy.schemaVersion;
  if (
    (typeof schemaVersion !== "string" && typeof schemaVersion !== "number") ||
    String(schemaVersion).length === 0
  ) {
    throw new Error('Policy field "schemaVersion" must be a non-empty string or number.');
  }

  if (typeof policy.publicReleaseBlocked !== "boolean") {
    throw new Error('Policy field "publicReleaseBlocked" must be a boolean.');
  }

  const arrayFields = [
    "requiredChecks",
    "forbiddenTrackedPaths",
    "forbiddenFilenamePatterns",
    "sensitiveContentPatterns",
    "manualReviewPaths",
    "allowedPublicAreas",
    "notes",
  ];

  for (const field of arrayFields) {
    if (!Array.isArray(policy[field])) {
      throw new Error(`Policy field "${field}" must be an array.`);
    }
  }

  if (policy.defaultVisibility !== "private") {
    throw new Error('Policy defaultVisibility must remain "private" until approved publication.');
  }

  return /** @type {Record<string, any>} */ (policy);
}

/**
 * @param {string} repoRoot
 */
export function listTrackedFiles(repoRoot) {
  const output = execFileSync("git", ["-C", repoRoot, "ls-files", "-z"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return output
    .split("\0")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * @param {string} repoRoot
 * @param {string} filePath
 */
function readTrackedText(repoRoot, filePath) {
  const absolutePath = join(repoRoot, filePath);
  return readFileSync(absolutePath, "utf8");
}

/**
 * @param {string} filePath
 */
function isTextScanCandidate(filePath) {
  return TEXT_FILE_PATTERN.test(filePath);
}

/**
 * @param {string} filePath
 * @param {string} rulePath
 * @param {"prefix" | "path-prefix" | "exact"} match
 */
function pathMatchesRule(filePath, rulePath, match) {
  if (match === "exact") {
    return filePath === rulePath;
  }

  if (match === "path-prefix") {
    return filePath.startsWith(rulePath);
  }

  return filePath === rulePath || filePath.startsWith(`${rulePath}/`);
}

/**
 * @param {string} filePath
 * @param {string[]} allowlistPaths
 */
function isAllowlistedPath(filePath, allowlistPaths) {
  return allowlistPaths.some((allowed) => {
    if (allowed.endsWith("/")) {
      return filePath.startsWith(allowed);
    }
    return filePath === allowed || filePath.startsWith(`${allowed}/`);
  });
}

/**
 * @param {string} filePath
 * @param {string[]} configPaths
 */
function isConfigPath(filePath, configPaths) {
  return configPaths.some((configPath) => {
    if (configPath.endsWith("/")) {
      return filePath.startsWith(configPath);
    }
    return filePath === configPath || filePath.startsWith(`${configPath}/`);
  });
}

/**
 * @param {string} email
 * @param {string[]} allowlistDomains
 */
function isAllowedEmailDomain(email, allowlistDomains) {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return allowlistDomains.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`),
  );
}

/**
 * @param {Record<string, any>} policy
 * @param {string} checkId
 */
function policyRequiresCheck(policy, checkId) {
  const required = policy.requiredChecks ?? [];
  return required.includes(checkId);
}

/**
 * @param {string} repoRoot
 * @returns {Finding[]}
 */
export function evaluateFreshHistory(repoRoot) {
  /** @type {Finding[]} */
  const findings = [];

  let commitCount = 0;
  try {
    const output = execFileSync("git", ["-C", repoRoot, "rev-list", "--all", "--count"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    commitCount = Number.parseInt(output, 10);
  } catch {
    commitCount = 0;
  }

  if (commitCount === 0) {
    findings.push({
      ruleId: "fresh-history-uninitialized",
      category: "fresh-history",
      severity: "blocking",
      path: ".git",
      message: "Repository has no commits yet; fresh root commit required before publication.",
    });
    return findings;
  }

  let rootCommits = [];
  try {
    rootCommits = execFileSync(
      "git",
      ["-C", repoRoot, "rev-list", "--max-parents=0", "HEAD"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    )
      .trim()
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean);
  } catch {
    rootCommits = [];
  }

  if (rootCommits.length === 0) {
    findings.push({
      ruleId: "fresh-history-root-missing",
      category: "fresh-history",
      severity: "blocking",
      path: ".git",
      message: "Unable to locate a root commit in repository history.",
    });
    return findings;
  }

  if (rootCommits.length > 1) {
    findings.push({
      ruleId: "fresh-history-multiple-roots",
      category: "fresh-history",
      severity: "blocking",
      path: ".git",
      message: "Repository history must originate from a single root commit.",
    });
  }

  try {
    const parents = execFileSync(
      "git",
      ["-C", repoRoot, "rev-list", "--parents", "-n", "1", rootCommits[0]],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ).trim();
    const parentCount = parents.split(/\s+/).length - 1;
    if (parentCount !== 0) {
      findings.push({
        ruleId: "fresh-history-root",
        category: "fresh-history",
        severity: "blocking",
        path: ".git",
        message: "Root commit must have no parent history.",
      });
    }
  } catch {
    findings.push({
      ruleId: "fresh-history-root",
      category: "fresh-history",
      severity: "blocking",
      path: ".git",
      message: "Unable to verify root commit status.",
    });
  }

  return findings;
}

/**
 * @param {string} repoRoot
 * @returns {Finding[]}
 */
export function evaluateNoGitRemote(repoRoot) {
  /** @type {Finding[]} */
  const findings = [];

  let remotes = "";
  try {
    remotes = execFileSync("git", ["-C", repoRoot, "remote", "-v"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    remotes = "";
  }

  if (remotes.length > 0) {
    findings.push({
      ruleId: "git-remote-present",
      category: "no-git-remote",
      severity: "blocking",
      path: ".git/config",
      message: "Publication candidate must not configure a Git remote.",
    });
  }

  const alternatesPath = join(repoRoot, ".git", "objects", "info", "alternates");
  if (fileExists(alternatesPath)) {
    findings.push({
      ruleId: "git-alternates-present",
      category: "no-git-remote",
      severity: "blocking",
      path: ".git/objects/info/alternates",
      message: "Shared Git object alternates must not be used in publication candidate.",
    });
  }

  return findings;
}

/**
 * @param {string} repoRoot
 * @returns {Finding[]}
 */
const AGPL_V3_MARKERS = [
  "GNU AFFERO GENERAL PUBLIC LICENSE",
  "Version 3, 19 November 2007",
  "GNU Affero General Public License",
];

const LEGAL_FOUNDATION_FILES = [
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  "GOVERNANCE.md",
  "TRADEMARKS.md",
  "DCO.md",
  "SUPPORT.md",
  "ROADMAP.md",
  "CHANGELOG.md",
  "NOTICE",
  "docs/open-source/licensing.md",
];

const GITHUB_TEMPLATE_FILES = [
  ".github/ISSUE_TEMPLATE/bug_report.yml",
  ".github/ISSUE_TEMPLATE/feature_request.yml",
  ".github/ISSUE_TEMPLATE/config.yml",
  ".github/PULL_REQUEST_TEMPLATE.md",
];

const FORBIDDEN_LICENSE_CLAIM_PATTERNS = [
  {
    id: "commercial-use-prohibited",
    pattern: /all commercial use requires a paid license/i,
    message: "Policy-controlled file misstates AGPL commercial use terms.",
  },
  {
    id: "every-company-must-purchase",
    pattern: /every company must purchase a commercial license/i,
    message: "Policy-controlled file misstates AGPL commercial use terms.",
  },
  {
    id: "additional-restriction",
    pattern: /additional restrictions beyond the gnu affero general public license/i,
    message: "Policy-controlled file may add restrictions beyond AGPL.",
  },
];

const POLICY_CONTROLLED_FILES = [
  "README.md",
  "LICENSE",
  "CONTRIBUTING.md",
  "docs/open-source/licensing.md",
  "TRADEMARKS.md",
  "NOTICE",
];

/**
 * @param {string} repoRoot
 */
export function evaluateLicensePresent(repoRoot) {
  /** @type {Finding[]} */
  const findings = [];
  const licensePath = join(repoRoot, "LICENSE");
  if (!fileExists(licensePath)) {
    findings.push({
      ruleId: "license-missing",
      category: "license-present",
      severity: "blocking",
      path: "LICENSE",
      message: "LICENSE file is required before public release.",
    });
    return findings;
  }

  let licenseText = "";
  try {
    licenseText = readFileSync(licensePath, "utf8");
  } catch {
    findings.push({
      ruleId: "license-unreadable",
      category: "license-present",
      severity: "blocking",
      path: "LICENSE",
      message: "LICENSE file exists but could not be read.",
    });
    return findings;
  }

  for (const marker of AGPL_V3_MARKERS) {
    if (!licenseText.includes(marker)) {
      findings.push({
        ruleId: "license-agpl-marker-missing",
        category: "license-present",
        severity: "blocking",
        path: "LICENSE",
        message: `LICENSE is missing expected AGPLv3 marker: ${marker}`,
      });
    }
  }

  return findings;
}

/**
 * @param {string} repoRoot
 */
export function evaluatePackageLicenseMetadata(repoRoot) {
  /** @type {Finding[]} */
  const findings = [];
  const packageJsonPath = join(repoRoot, "package.json");

  if (!fileExists(packageJsonPath)) {
    findings.push({
      ruleId: "package-json-missing",
      category: "package-license-metadata",
      severity: "blocking",
      path: "package.json",
      message: "package.json is required.",
    });
    return findings;
  }

  let packageJson;
  try {
    packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  } catch {
    findings.push({
      ruleId: "package-json-invalid",
      category: "package-license-metadata",
      severity: "blocking",
      path: "package.json",
      message: "package.json could not be parsed.",
    });
    return findings;
  }

  if (packageJson.license !== "AGPL-3.0-only") {
    findings.push({
      ruleId: "package-license-mismatch",
      category: "package-license-metadata",
      severity: "blocking",
      path: "package.json",
      message: 'package.json must declare "license": "AGPL-3.0-only".',
    });
  }

  if (packageJson.private !== true) {
    findings.push({
      ruleId: "package-private-flag",
      category: "package-license-metadata",
      severity: "blocking",
      path: "package.json",
      message: 'package.json must keep "private": true until npm publication is intentionally approved.',
    });
  }

  return findings;
}

/**
 * @param {string} repoRoot
 */
export function evaluateLegalFoundationDocs(repoRoot) {
  /** @type {Finding[]} */
  const findings = [];

  for (const docPath of LEGAL_FOUNDATION_FILES) {
    if (!fileExists(join(repoRoot, docPath))) {
      findings.push({
        ruleId: "legal-foundation-missing",
        category: "legal-foundation",
        severity: "blocking",
        path: docPath,
        message: "Required legal or community foundation file is missing.",
      });
    }
  }

  for (const templatePath of GITHUB_TEMPLATE_FILES) {
    if (!fileExists(join(repoRoot, templatePath))) {
      findings.push({
        ruleId: "github-template-missing",
        category: "legal-foundation",
        severity: "blocking",
        path: templatePath,
        message: "Required GitHub contribution template is missing.",
      });
    }
  }

  return findings;
}

/**
 * @param {string} repoRoot
 */
export function evaluateLicenseClaimHygiene(repoRoot) {
  /** @type {Finding[]} */
  const findings = [];

  for (const relativePath of POLICY_CONTROLLED_FILES) {
    const absolutePath = join(repoRoot, relativePath);
    if (!fileExists(absolutePath)) {
      continue;
    }

    let content = "";
    try {
      content = readFileSync(absolutePath, "utf8");
    } catch {
      continue;
    }

    for (const rule of FORBIDDEN_LICENSE_CLAIM_PATTERNS) {
      if (rule.pattern.test(content)) {
        findings.push({
          ruleId: rule.id,
          category: "license-claim-hygiene",
          severity: "blocking",
          path: relativePath,
          message: rule.message,
        });
      }
    }
  }

  return findings;
}

/**
 * @param {string} repoRoot
 * @returns {Finding[]}
 */
export function evaluateDocumentationReadiness(repoRoot) {
  /** @type {Finding[]} */
  const findings = [];
  const requiredDocs = [
    "README.md",
    "docs/open-source/fresh-history.md",
    "docs/open-source/publication-boundary.md",
    "docs/open-source/distribution-boundary.md",
    "docs/open-source/deployment-modes.md",
    "docs/open-source/entitlements.md",
    "docs/open-source/database.md",
  ];
  for (const docPath of requiredDocs) {
    if (!fileExists(join(repoRoot, docPath))) {
      findings.push({
        ruleId: "documentation-missing",
        category: "documentation-readiness",
        severity: "blocking",
        path: docPath,
        message: "Required documentation file is missing.",
      });
    }
  }
  return findings;
}

const AUTH_ARCHITECTURE_FILES = [
  "lib/auth/types.ts",
  "lib/auth/config.ts",
  "lib/auth/factory.ts",
  "lib/auth/principal.ts",
  "lib/auth/session.ts",
  "lib/auth/guards.ts",
  "lib/auth/providers/local.ts",
  "lib/auth/index.ts",
  "lib/auth/public-config.ts",
  "auth.ts",
  "app/api/auth/[...nextauth]/route.ts",
  "scripts/check-auth-boundaries.mjs",
  "scripts/auth-bootstrap.ts",
  "tests/auth.test.ts",
  "tests/auth-boundary-check.test.ts",
  "docs/open-source/authentication.md",
  "supabase/migrations/20260731140000_cited_phase5_canonical_identities.sql",
];

const DEPLOYMENT_ARCHITECTURE_FILES = [
  "lib/deployment/types.ts",
  "lib/deployment/config.ts",
  "lib/deployment/mode.ts",
  "lib/deployment/capabilities.ts",
  "lib/deployment/guards.ts",
  "lib/deployment/http-guards.ts",
  "lib/deployment/public-config.ts",
  "lib/deployment/index.ts",
  "scripts/check-deployment-boundaries.mjs",
  "tests/deployment.test.ts",
  "tests/deployment-boundary-check.test.ts",
  "tests/public-surface-boundary.test.ts",
  ".env.self-hosted.example",
  "config/public-surface.json",
  "docs/open-source/distribution-boundary.md",
];

/**
 * @param {string} repoRoot
 * @returns {Finding[]}
 */
export function evaluateDeploymentArchitecturePresent(repoRoot) {
  /** @type {Finding[]} */
  const findings = [];

  for (const relativePath of DEPLOYMENT_ARCHITECTURE_FILES) {
    if (!fileExists(join(repoRoot, relativePath))) {
      findings.push({
        ruleId: "deployment-architecture-missing",
        category: "deployment-architecture-present",
        severity: "blocking",
        path: relativePath,
        message: "Required deployment-mode architecture artifact is missing.",
      });
    }
  }

  return findings;
}

/**
 * @param {string} repoRoot
 * @returns {Finding[]}
 */
export function evaluateAuthArchitecturePresent(repoRoot) {
  /** @type {Finding[]} */
  const findings = [];

  for (const relativePath of AUTH_ARCHITECTURE_FILES) {
    if (!fileExists(join(repoRoot, relativePath))) {
      findings.push({
        ruleId: "auth-architecture-missing",
        category: "auth-architecture-present",
        severity: "blocking",
        path: relativePath,
        message: "Required authentication architecture artifact is missing.",
      });
    }
  }

  return findings;
}

const ENTITLEMENT_ARCHITECTURE_FILES = [
  "lib/entitlements/types.ts",
  "lib/entitlements/provider.ts",
  "lib/entitlements/factory.ts",
  "lib/entitlements/resolve.ts",
  "lib/entitlements/providers/self-hosted.ts",
  "lib/entitlements/plan-catalog.ts",
  "lib/entitlements/index.ts",
  "scripts/check-billing-boundaries.mjs",
  "docs/open-source/entitlements.md",
  "tests/entitlements-phase6.test.ts",
  "tests/billing-boundary-check.test.ts",
];

/**
 * @param {string} repoRoot
 * @returns {Finding[]}
 */
export function evaluateEntitlementArchitecturePresent(repoRoot) {
  /** @type {Finding[]} */
  const findings = [];

  for (const relativePath of ENTITLEMENT_ARCHITECTURE_FILES) {
    if (!fileExists(join(repoRoot, relativePath))) {
      findings.push({
        ruleId: "entitlement-architecture-missing",
        category: "entitlement-architecture-present",
        severity: "blocking",
        path: relativePath,
        message: "Required entitlement architecture artifact is missing.",
      });
    }
  }

  return findings;
}

const DATABASE_ARCHITECTURE_FILES = [
  "lib/db/config.ts",
  "lib/db/factory.ts",
  "lib/db/errors.ts",
  "lib/db/health.ts",
  "lib/db/providers/postgres/query-builder.ts",
  "lib/db/providers/supabase/client.ts",
  "lib/db/repositories/index.ts",
  "lib/db/migrations/runner.mjs",
  "scripts/check-database-boundaries.mjs",
  "scripts/db-migrate.mjs",
  "scripts/db-validate.mjs",
  "scripts/db-seed.mjs",
  "docs/open-source/database.md",
  "supabase/seed.sql",
  "tests/database-phase7.test.ts",
  "tests/database-boundary-check.test.ts",
];

/**
 * @param {string} repoRoot
 * @returns {Finding[]}
 */
export function evaluateDatabaseArchitecturePresent(repoRoot) {
  /** @type {Finding[]} */
  const findings = [];

  for (const relativePath of DATABASE_ARCHITECTURE_FILES) {
    if (!fileExists(join(repoRoot, relativePath))) {
      findings.push({
        ruleId: "database-architecture-missing",
        category: "database-architecture-present",
        severity: "blocking",
        path: relativePath,
        message: "Required database architecture artifact is missing.",
      });
    }
  }

  return findings;
}

/**
 * @param {string} repoRoot
 * @returns {Finding[]}
 */
export function evaluatePublicSurfaceVerification(repoRoot) {
  /** @type {Finding[]} */
  const findings = [];
  try {
    execFileSync("node", ["scripts/check-public-surface.mjs"], {
      cwd: repoRoot,
      stdio: "pipe",
      encoding: "utf8",
    });
  } catch (error) {
    const message =
      error instanceof Error && "stdout" in error && typeof error.stdout === "string"
        ? error.stdout.trim() || error.message
        : error instanceof Error
          ? error.message
          : "Public surface verification failed.";
    findings.push({
      ruleId: "public-surface-check-failed",
      category: "public-surface-verification",
      severity: "blocking",
      path: "config/public-surface.json",
      message: message.slice(0, 500),
    });
  }
  return findings;
}

/**
 * @param {string} repoRoot
 * @param {string[]} requiredChecks
 * @returns {Finding[]}
 */
export function evaluateDeferredReleaseChecks(repoRoot, requiredChecks) {
  /** @type {Finding[]} */
  const findings = [];
  const deferred = [
    {
      checkId: "clean-install-verification",
      ruleId: "clean-install-pending",
      category: "clean-install-verification",
      path: "package-lock.json",
      message: "Clean installation verification is scheduled for a later release phase.",
    },
    {
      checkId: "human-approval",
      ruleId: "human-approval-pending",
      category: "human-approval",
      path: "config/publication-policy.json",
      message: "Human approval is required before publication.",
    },
  ];

  for (const item of deferred) {
    if (!requiredChecks.includes(item.checkId)) {
      continue;
    }
    findings.push({
      ruleId: item.ruleId,
      category: item.category,
      severity: "blocking",
      path: item.path,
      message: item.message,
    });
  }

  return findings;
}


export function evaluatePublicationReadiness(policy, repoRoot, trackedFiles) {
  /** @type {Finding[]} */
  const findings = [];

  if (policy.publicReleaseBlocked) {
    findings.push({
      ruleId: "release-blocked",
      category: "policy",
      severity: "blocking",
      path: "config/publication-policy.json",
      message: "Public release is explicitly blocked by publication policy.",
    });
  }

  for (const rule of policy.forbiddenTrackedPaths ?? []) {
    for (const filePath of trackedFiles) {
      if (pathMatchesRule(filePath, rule.path, rule.match ?? "prefix")) {
        findings.push({
          ruleId: rule.id,
          category: "forbidden-tracked-path",
          severity: "blocking",
          path: filePath,
          message: rule.reason ?? "Tracked path is forbidden for publication.",
        });
      }
    }
  }

  for (const rule of policy.forbiddenFilenamePatterns ?? []) {
    const regex = new RegExp(rule.pattern, rule.flags ?? "");
    for (const filePath of trackedFiles) {
      if (regex.test(filePath)) {
        findings.push({
          ruleId: rule.id,
          category: "forbidden-filename",
          severity: "blocking",
          path: filePath,
          message: rule.reason ?? "Tracked filename is forbidden for publication.",
        });
      }
    }
  }

  const allowlistedContentPaths = policy.sensitiveContentAllowlistPaths ?? [];

  for (const filePath of trackedFiles) {
    if (!isTextScanCandidate(filePath)) {
      continue;
    }
    if (isAllowlistedPath(filePath, allowlistedContentPaths)) {
      continue;
    }

    let content;
    try {
      content = readTrackedText(repoRoot, filePath);
    } catch {
      continue;
    }

    for (const rule of policy.sensitiveContentPatterns ?? []) {
      const lines = content.split(/\r?\n/);
      let matched = false;
      for (const line of lines) {
        const regex = new RegExp(rule.pattern, rule.flags ?? "");
        if (regex.test(line)) {
          matched = true;
          break;
        }
      }
      if (matched) {
        findings.push({
          ruleId: rule.id,
          category: "sensitive-content",
          severity: "blocking",
          path: filePath,
          message: rule.reason ?? "Suspicious sensitive content pattern detected.",
        });
      }
    }

    if (!isAllowlistedPath(filePath, allowlistedContentPaths)) {
      const lowerContent = content.toLowerCase();
      for (const marker of policy.doNotPublishMarkers ?? []) {
        if (lowerContent.includes(marker.toLowerCase())) {
          findings.push({
            ruleId: "do-not-publish-marker",
            category: "do-not-publish",
            severity: "blocking",
            path: filePath,
            message: "Document contains an explicit do-not-publish marker.",
          });
          break;
        }
      }
    }
  }

  for (const filePath of trackedFiles) {
    const allowedTrackedEnvExamples = new Set([
      ".env.example",
      ".env.self-hosted.example",
      ".env.docker.example",
    ]);
    if (!/^\.env(\.|$)/.test(filePath) || allowedTrackedEnvExamples.has(filePath)) {
      continue;
    }

    findings.push({
      ruleId: "tracked-env-file",
      category: "tracked-env-file",
      severity: "blocking",
      path: filePath,
      message: "Tracked environment file detected.",
    });
  }

  const personalEmailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  const configPaths = policy.personalEmailConfigPaths ?? [];
  const allowedDomains = policy.personalEmailAllowlistDomains ?? [];

  for (const filePath of trackedFiles) {
    if (!isConfigPath(filePath, configPaths) || !isTextScanCandidate(filePath)) {
      continue;
    }

    let content;
    try {
      content = readTrackedText(repoRoot, filePath);
    } catch {
      continue;
    }

    const matches = content.match(personalEmailRegex) ?? [];
    for (const email of matches) {
      if (!isAllowedEmailDomain(email, allowedDomains)) {
        findings.push({
          ruleId: "personal-email-in-config",
          category: "personal-email",
          severity: "blocking",
          path: filePath,
          message: "Personal or non-allowlisted email address found in configuration file.",
        });
        break;
      }
    }
  }

  const mcpPaths = policy.mcpConfigPaths ?? [];
  for (const filePath of trackedFiles) {
    if (!mcpPaths.includes(filePath)) {
      continue;
    }

    let content;
    try {
      content = readTrackedText(repoRoot, filePath);
    } catch {
      continue;
    }

    for (const rule of policy.mcpPrivateReferencePatterns ?? []) {
      const regex = new RegExp(rule.pattern, rule.flags ?? "i");
      if (regex.test(content)) {
        findings.push({
          ruleId: rule.id,
          category: "mcp-private-reference",
          severity: "blocking",
          path: filePath,
          message: rule.reason ?? "Private MCP project reference detected.",
        });
      }
    }
  }

  for (const rule of policy.manualReviewPaths ?? []) {
    for (const filePath of trackedFiles) {
      if (pathMatchesRule(filePath, rule.path, rule.match ?? "prefix")) {
        findings.push({
          ruleId: rule.id,
          category: "manual-review",
          severity: "warning",
          path: filePath,
          message: rule.reason ?? "Path requires manual publication review.",
        });
      }
    }
  }

  const requiredChecks = policy.requiredChecks ?? [];
  if (policyRequiresCheck(policy, "fresh-history")) {
    findings.push(...evaluateFreshHistory(repoRoot));
  }
  if (policyRequiresCheck(policy, "no-git-remote")) {
    findings.push(...evaluateNoGitRemote(repoRoot));
  }
  if (policyRequiresCheck(policy, "license-present")) {
    findings.push(...evaluateLicensePresent(repoRoot));
  }
  if (policyRequiresCheck(policy, "package-license-metadata")) {
    findings.push(...evaluatePackageLicenseMetadata(repoRoot));
  }
  if (policyRequiresCheck(policy, "legal-foundation")) {
    findings.push(...evaluateLegalFoundationDocs(repoRoot));
  }
  if (policyRequiresCheck(policy, "license-claim-hygiene")) {
    findings.push(...evaluateLicenseClaimHygiene(repoRoot));
  }
  if (policyRequiresCheck(policy, "documentation-readiness")) {
    findings.push(...evaluateDocumentationReadiness(repoRoot));
  }
  if (policyRequiresCheck(policy, "deployment-architecture-present")) {
    findings.push(...evaluateDeploymentArchitecturePresent(repoRoot));
  }
  if (policyRequiresCheck(policy, "auth-architecture-present")) {
    findings.push(...evaluateAuthArchitecturePresent(repoRoot));
  }
  if (policyRequiresCheck(policy, "entitlement-architecture-present")) {
    findings.push(...evaluateEntitlementArchitecturePresent(repoRoot));
  }
  if (policyRequiresCheck(policy, "database-architecture-present")) {
    findings.push(...evaluateDatabaseArchitecturePresent(repoRoot));
  }
  if (policyRequiresCheck(policy, "public-surface-verification")) {
    findings.push(...evaluatePublicSurfaceVerification(repoRoot));
  }
  findings.push(...evaluateDeferredReleaseChecks(repoRoot, requiredChecks));

  return dedupeFindings(findings);
}

/**
 * @param {Finding[]} findings
 */
function dedupeFindings(findings) {
  const seen = new Set();
  /** @type {Finding[]} */
  const deduped = [];

  for (const finding of findings) {
    const key = `${finding.severity}:${finding.ruleId}:${finding.path}:${finding.message}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(finding);
  }

  return deduped;
}

/**
 * @param {Finding[]} findings
 */
export function summarizeFindings(findings) {
  const blocking = findings.filter((finding) => finding.severity === "blocking");
  const warnings = findings.filter((finding) => finding.severity === "warning");
  return { blocking, warnings };
}

/**
 * @param {Finding[]} findings
 */
export function formatFindingsForOutput(findings) {
  return findings.map((finding) => ({
    severity: finding.severity,
    ruleId: finding.ruleId,
    category: finding.category,
    path: finding.path,
    message: finding.message,
  }));
}

/**
 * @param {object} options
 * @param {string} options.repoRoot
 * @param {string} options.policyPath
 * @param {string[]=} options.trackedFiles
 */
export function runPublicationCheck({ repoRoot, policyPath, trackedFiles }) {
  let policy;
  try {
    policy = validatePolicyShape(readPolicyFile(policyPath));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown policy error.";
    const findings = [
      {
        ruleId: "policy-invalid",
        category: "policy",
        severity: "blocking",
        path: relative(repoRoot, policyPath),
        message,
      },
    ];
    const { blocking, warnings } = summarizeFindings(findings);
    return {
      ok: false,
      error: message,
      findings,
      blocking,
      warnings,
    };
  }

  const files = trackedFiles ?? listTrackedFiles(repoRoot);
  const findings = evaluatePublicationReadiness(policy, repoRoot, files);
  const { blocking, warnings } = summarizeFindings(findings);

  return {
    ok: blocking.length === 0,
    policy,
    findings,
    blocking,
    warnings,
  };
}

/**
 * @param {string} repoRoot
 * @param {string} policyRelativePath
 */
export function resolvePolicyPath(repoRoot, policyRelativePath) {
  return join(repoRoot, policyRelativePath);
}

/**
 * @param {string} filePath
 */
export function fileExists(filePath) {
  try {
    statSync(filePath);
    return true;
  } catch {
    return false;
  }
}
