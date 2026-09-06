import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { runLicenseCheck } from "../license/dependency-licenses.mjs";
import { readPolicyFile, runPublicationCheck } from "../publication/readiness.mjs";

export const TARGET_VERSION = "0.1.0";
export const TARGET_TAG = "v0.1.0";

const CONFIRMED_RELEASE_TARGET = {
  owner: "cited-cc",
  repository: "cited",
  repositoryUrl: "https://github.com/cited-cc/cited",
  containerImage: "ghcr.io/cited-cc/cited",
};

const FORBIDDEN_REMOTES = [
  "github.com/accomplish999/cited.git",
  "github.com/accomplish999/cited",
  "github.com/accomplish999/cited-public.git",
  "github.com/accomplish999/cited-public",
  "github.com/accomplish-labs/cited.git",
  "github.com/accomplish-labs/cited",
];

const FORBIDDEN_TAG_PATTERNS = [
  /^archive\//,
  /^private\//,
  /^staging\//,
  /^backup\//,
];

/**
 * @param {string} repoRoot
 */
export function readJsonFile(repoRoot, relativePath) {
  const absolutePath = join(repoRoot, relativePath);
  return JSON.parse(readFileSync(absolutePath, "utf8"));
}

/**
 * @param {string} repoRoot
 */
export function fileExists(repoRoot, relativePath) {
  try {
    statSync(join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} repoRoot
 * @param {string[]} args
 */
export function git(repoRoot, args) {
  return execFileSync("git", ["-C", repoRoot, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

/**
 * @param {string} repoRoot
 */
export function getGitStatus(repoRoot) {
  const porcelain = git(repoRoot, ["status", "--porcelain"]);
  const remotes = git(repoRoot, ["remote"]).split("\n").filter(Boolean);
  const tags = git(repoRoot, ["tag", "-l"]).split("\n").filter(Boolean);
  const branches = git(repoRoot, ["branch", "--format=%(refname:short)"]).split("\n").filter(Boolean);

  return {
    dirty: porcelain.length > 0,
    porcelain,
    remotes,
    tags,
    branches,
    head: git(repoRoot, ["rev-parse", "HEAD"]),
    branch: git(repoRoot, ["rev-parse", "--abbrev-ref", "HEAD"]),
    commitCount: Number(git(repoRoot, ["rev-list", "--count", "HEAD"])),
  };
}

/**
 * @param {string} repoRoot
 * @param {"candidate" | "release"} mode
 */
export function validateRepositoryMetadata(repoRoot, mode) {
  /** @type {{ ruleId: string; message: string; path: string }[]} */
  const violations = [];
  const metadataPath = "config/repository-metadata.json";

  if (!fileExists(repoRoot, metadataPath)) {
    violations.push({
      ruleId: "metadata-missing",
      path: metadataPath,
      message: "Repository metadata manifest is required.",
    });
    return violations;
  }

  const metadata = readJsonFile(repoRoot, metadataPath);
  const pkg = readJsonFile(repoRoot, "package.json");

  if (pkg.version !== TARGET_VERSION) {
    violations.push({
      ruleId: "version-mismatch",
      path: "package.json",
      message: `Package version must be ${TARGET_VERSION}.`,
    });
  }

  if (metadata.version && metadata.version !== TARGET_VERSION) {
    violations.push({
      ruleId: "metadata-version-mismatch",
      path: metadataPath,
      message: `Metadata version must be ${TARGET_VERSION}.`,
    });
  }

  if (mode === "release") {
    for (const field of ["organization", "repositoryName", "repositoryUrl", "containerImageName"]) {
      if (!metadata[field] || typeof metadata[field] !== "string" || metadata[field].length === 0) {
        violations.push({
          ruleId: "metadata-field-missing",
          path: metadataPath,
          message: `Release mode requires metadata field "${field}".`,
        });
      }
    }

    if (metadata.homepage && !metadata.homepage.startsWith("https://")) {
      violations.push({
        ruleId: "homepage-https",
        path: metadataPath,
        message: "Homepage must use HTTPS.",
      });
    }

    if (metadata.repositoryUrl?.includes("accomplish999/cited-public")) {
      violations.push({
        ruleId: "forbidden-staging-url",
        path: metadataPath,
        message: "Repository URL must not reference the staging repository.",
      });
    }

    if (`${metadata.organization}/${metadata.repositoryName}` === "accomplish999/cited") {
      violations.push({
        ruleId: "forbidden-private-url",
        path: metadataPath,
        message: "Repository URL must not reference the original private production repository.",
      });
    }

    const confirmed = `${CONFIRMED_RELEASE_TARGET.owner}/${CONFIRMED_RELEASE_TARGET.repository}`;
    const actual = `${metadata.organization}/${metadata.repositoryName}`;
    if (actual !== confirmed) {
      violations.push({
        ruleId: "release-target-mismatch",
        path: metadataPath,
        message: `Release target must be exactly ${confirmed}.`,
      });
    }

    if (metadata.repositoryUrl !== CONFIRMED_RELEASE_TARGET.repositoryUrl) {
      violations.push({
        ruleId: "release-url-mismatch",
        path: metadataPath,
        message: `Repository URL must be ${CONFIRMED_RELEASE_TARGET.repositoryUrl}.`,
      });
    }

    if (metadata.containerImageName !== CONFIRMED_RELEASE_TARGET.containerImage) {
      violations.push({
        ruleId: "container-image-mismatch",
        path: metadataPath,
        message: `Container image must be ${CONFIRMED_RELEASE_TARGET.containerImage}.`,
      });
    }
  }

  return violations;
}

/**
 * @param {string} repoRoot
 * @param {"candidate" | "release"} mode
 */
export function validateGitState(repoRoot, mode) {
  /** @type {{ ruleId: string; message: string; path: string }[]} */
  const violations = [];
  const status = getGitStatus(repoRoot);
  const ciTagRelease =
    process.env.GITHUB_ACTIONS === "true" &&
    process.env.GITHUB_REF_TYPE === "tag" &&
    process.env.GITHUB_REF_NAME === TARGET_TAG;

  if (status.dirty) {
    violations.push({
      ruleId: "dirty-tree",
      path: ".",
      message: "Working tree must be clean before release.",
    });
  }

  if (!ciTagRelease && status.branch !== "main") {
    violations.push({
      ruleId: "wrong-branch",
      path: ".",
      message: 'Release must be prepared on branch "main".',
    });
  }

  for (const tag of status.tags) {
    for (const pattern of FORBIDDEN_TAG_PATTERNS) {
      if (pattern.test(tag)) {
        violations.push({
          ruleId: "forbidden-tag",
          path: `.git/refs/tags/${tag}`,
          message: "Forbidden archive or private tag detected.",
        });
      }
    }
  }

  if (!ciTagRelease && status.tags.includes(TARGET_TAG)) {
    violations.push({
      ruleId: "tag-already-exists",
      path: `.git/refs/tags/${TARGET_TAG}`,
      message: `Tag ${TARGET_TAG} already exists locally.`,
    });
  }

  for (const remote of status.remotes) {
    const url = git(repoRoot, ["remote", "get-url", remote]).toLowerCase();
    for (const forbidden of FORBIDDEN_REMOTES) {
      if (url.includes(forbidden.replace(".git", ""))) {
        violations.push({
          ruleId: "forbidden-remote",
          path: `.git/config`,
          message: `Remote "${remote}" references a forbidden private or staging repository.`,
        });
      }
    }
  }

  if (mode === "candidate" && status.remotes.length > 0) {
    violations.push({
      ruleId: "unexpected-remote",
      path: ".git/config",
      message: "Release candidate mode requires no git remotes.",
    });
  }

  if (mode === "release") {
    if (status.remotes.length !== 1 || !status.remotes.includes("origin")) {
      violations.push({
        ruleId: "release-remote-missing",
        path: ".git/config",
        message: 'Release mode requires exactly one remote named "origin".',
      });
    } else {
      const metadata = readJsonFile(repoRoot, "config/repository-metadata.json");
      const expectedUrl = metadata.repositoryUrl?.replace(/\.git$/, "").toLowerCase();
      const originUrl = git(repoRoot, ["remote", "get-url", "origin"]).replace(/\.git$/, "").toLowerCase();
      if (!expectedUrl || originUrl !== expectedUrl) {
        violations.push({
          ruleId: "release-remote-mismatch",
          path: ".git/config",
          message: "Origin remote must match approved repository metadata URL.",
        });
      }
    }
  }

  try {
    const alternates = readFileSync(join(repoRoot, ".git/objects/info/alternates"), "utf8").trim();
    if (alternates.length > 0) {
      violations.push({
        ruleId: "git-alternates",
        path: ".git/objects/info/alternates",
        message: "Shared object store alternates are forbidden.",
      });
    }
  } catch {
    // no alternates file
  }

  return violations;
}

/**
 * @param {string} repoRoot
 */
export function validateChangelog(repoRoot) {
  /** @type {{ ruleId: string; message: string; path: string }[]} */
  const violations = [];
  const changelogPath = "CHANGELOG.md";

  if (!fileExists(repoRoot, changelogPath)) {
    violations.push({
      ruleId: "changelog-missing",
      path: changelogPath,
      message: "CHANGELOG.md is required.",
    });
    return violations;
  }

  const content = readFileSync(join(repoRoot, changelogPath), "utf8");
  if (!content.includes(`## [${TARGET_VERSION}]`)) {
    violations.push({
      ruleId: "changelog-entry-missing",
      path: changelogPath,
      message: `CHANGELOG must include a [${TARGET_VERSION}] section.`,
    });
  }

  return violations;
}

/**
 * @param {string} repoRoot
 */
export function validateDockerLabels(repoRoot) {
  /** @type {{ ruleId: string; message: string; path: string }[]} */
  const violations = [];
  const dockerfilePath = "Dockerfile";

  if (!fileExists(repoRoot, dockerfilePath)) {
    violations.push({
      ruleId: "dockerfile-missing",
      path: dockerfilePath,
      message: "Dockerfile is required for container release.",
    });
    return violations;
  }

  const content = readFileSync(join(repoRoot, dockerfilePath), "utf8");
  const requiredLabels = [
    "org.opencontainers.image.title",
    "org.opencontainers.image.version",
    "org.opencontainers.image.source",
    "org.opencontainers.image.revision",
    "org.opencontainers.image.licenses",
    "org.opencontainers.image.description",
  ];

  for (const label of requiredLabels) {
    if (!content.includes(label)) {
      violations.push({
        ruleId: "docker-label-missing",
        path: dockerfilePath,
        message: `Dockerfile must declare OCI label ${label}.`,
      });
    }
  }

  return violations;
}

/**
 * @param {string} repoRoot
 */
export function validateReleaseWorkflow(repoRoot) {
  /** @type {{ ruleId: string; message: string; path: string }[]} */
  const violations = [];
  const workflowPath = ".github/workflows/release.yml";

  if (!fileExists(repoRoot, workflowPath)) {
    violations.push({
      ruleId: "release-workflow-missing",
      path: workflowPath,
      message: "Release workflow is required.",
    });
    return violations;
  }

  const content = readFileSync(join(repoRoot, workflowPath), "utf8");
  if (content.includes("pull_request_target")) {
    violations.push({
      ruleId: "release-workflow-prt",
      path: workflowPath,
      message: "Release workflow must not use pull_request_target.",
    });
  }
  if (content.includes("npm publish")) {
    violations.push({
      ruleId: "release-workflow-npm",
      path: workflowPath,
      message: "Release workflow must not publish npm packages.",
    });
  }

  return violations;
}

/**
 * @param {string} repoRoot
 * @param {"candidate" | "release"} mode
 */
export function runReleasePublicationCheck(repoRoot, mode) {
  const policyPath = join(repoRoot, "config/publication-policy.json");
  const result = runPublicationCheck({
    repoRoot,
    policyPath,
  });

  if (mode === "candidate") {
    const allowedRuleIds = new Set(["release-blocked", "human-approval-pending", "no-git-remote"]);
    const blocking = result.blocking ?? [];
    const filtered = blocking.filter((finding) => !allowedRuleIds.has(finding.ruleId));
    return {
      ok: filtered.length === 0 && !result.error,
      findings: result.findings,
      blocking: filtered,
      warnings: result.warnings,
    };
  }

  return {
    ok: result.ok,
    findings: result.findings,
    blocking: result.blocking,
    warnings: result.warnings,
  };
}

/**
 * @param {string} repoRoot
 */
export function validateSbom(repoRoot) {
  /** @type {{ ruleId: string; message: string; path: string }[]} */
  const violations = [];
  const sbomPath = ".cited/sbom/sbom.json";

  if (!fileExists(repoRoot, sbomPath)) {
    violations.push({
      ruleId: "sbom-missing",
      path: sbomPath,
      message: "Run npm run sbom:generate before release check.",
    });
    return violations;
  }

  const sbom = readJsonFile(repoRoot, sbomPath);
  if (!Array.isArray(sbom.packages) || sbom.packages.length === 0) {
    violations.push({
      ruleId: "sbom-empty",
      path: sbomPath,
      message: "SBOM must contain package entries.",
    });
  }

  return violations;
}

/**
 * @param {string} repoRoot
 * @param {object} options
 * @param {"candidate" | "release"} options.mode
 * @param {boolean} [options.runCiChecks]
 */
export function collectReleaseViolations(repoRoot, options) {
  const { mode, runCiChecks = false } = options;
  /** @type {{ ruleId: string; message: string; path: string }[]} */
  const violations = [];

  violations.push(...validateRepositoryMetadata(repoRoot, mode));
  violations.push(...validateGitState(repoRoot, mode));
  violations.push(...validateChangelog(repoRoot));
  violations.push(...validateDockerLabels(repoRoot));
  violations.push(...validateReleaseWorkflow(repoRoot));
  violations.push(...validateSbom(repoRoot));

  for (const required of ["LICENSE", "NOTICE", "DCO.md", "SECURITY.md"]) {
    if (!fileExists(repoRoot, required)) {
      violations.push({
        ruleId: "legal-artifact-missing",
        path: required,
        message: `${required} is required for release.`,
      });
    }
  }

  const licenseResult = runLicenseCheck(repoRoot);
  if (!licenseResult.ok) {
    violations.push({
      ruleId: "license-check-failed",
      path: "package.json",
      message: "Dependency license check must pass before release.",
    });
  }

  const publication = runReleasePublicationCheck(repoRoot, mode);
  for (const finding of publication.blocking ?? []) {
    violations.push({
      ruleId: finding.ruleId,
      path: finding.path,
      message: finding.message,
    });
  }

  if (runCiChecks) {
    // Caller runs external npm scripts; placeholder for structured results.
  }

  return violations;
}

/**
 * @param {string} repoRoot
 * @param {string} outputDir
 */
export function writeLicenseInventory(repoRoot, outputDir) {
  const result = runLicenseCheck(repoRoot);
  const inventory = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    packageCount: result.findings.length,
    packages: result.findings.map((finding) => ({
      name: finding.name,
      version: finding.version,
      license: finding.license,
      category: finding.category,
    })),
  };

  const outputPath = join(outputDir, "license-inventory.json");
  writeFileSync(outputPath, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");
  return outputPath;
}

/**
 * @param {string} filePath
 */
export function sha256File(filePath) {
  const hash = createHash("sha256");
  hash.update(readFileSync(filePath));
  return hash.digest("hex");
}

/**
 * @param {string} repoRoot
 * @param {string} outputDir
 */
export function generateReleaseArtifacts(repoRoot, outputDir) {
  mkdirSync(outputDir, { recursive: true });

  const archiveBase = `cited-${TARGET_VERSION}-source`;
  const archivePath = join(outputDir, `${archiveBase}.tar.gz`);

  execFileSync(
    "git",
    [
      "-C",
      repoRoot,
      "archive",
      "--format=tar.gz",
      "--prefix",
      `${archiveBase}/`,
      "-o",
      archivePath,
      "HEAD",
    ],
    { stdio: "pipe" },
  );

  const sbomSource = join(repoRoot, ".cited/sbom/sbom.json");
  const sbomDest = join(outputDir, "sbom.json");
  writeFileSync(sbomDest, readFileSync(sbomSource, "utf8"), "utf8");

  writeLicenseInventory(repoRoot, outputDir);

  /** @type {{ path: string; sha256: string; bytes: number }[]} */
  const artifacts = [];
  for (const fileName of readdirSync(outputDir)) {
    const filePath = join(outputDir, fileName);
    if (!statSync(filePath).isFile()) continue;
    if (fileName === "checksums.sha256" || fileName === "release-manifest.json") continue;
    artifacts.push({
      path: fileName,
      sha256: sha256File(filePath),
      bytes: statSync(filePath).size,
    });
  }

  const checksumLines = artifacts.map((item) => `${item.sha256}  ${item.path}`).join("\n");
  writeFileSync(join(outputDir, "checksums.sha256"), `${checksumLines}\n`, "utf8");

  const metadata = readJsonFile(repoRoot, "config/repository-metadata.json");
  const manifest = {
    schemaVersion: 1,
    version: TARGET_VERSION,
    tag: TARGET_TAG,
    generatedAt: new Date().toISOString(),
    gitRevision: git(repoRoot, ["rev-parse", "HEAD"]),
    repositoryUrl: metadata.repositoryUrl ?? null,
    containerImage: metadata.containerImageName ?? null,
    license: metadata.license ?? "AGPL-3.0-only",
    artifacts,
  };

  writeFileSync(join(outputDir, "release-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  return {
    outputDir: relative(repoRoot, outputDir),
    artifacts: [...artifacts.map((a) => a.path), "checksums.sha256", "release-manifest.json"],
  };
}

/**
 * @param {string} repoRoot
 */
export function readPublicationPolicy(repoRoot) {
  return readPolicyFile(join(repoRoot, "config/publication-policy.json"));
}
