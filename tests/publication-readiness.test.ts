import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  evaluateLegalFoundationDocs,
  evaluateLicenseClaimHygiene,
  evaluateLicensePresent,
  evaluatePackageLicenseMetadata,
  evaluatePublicationReadiness,
  readPolicyFile,
  runPublicationCheck,
  validatePolicyShape,
} from "../lib/publication/readiness.mjs";

function fixtureStripeLikeSecret(): string {
  return `${String.fromCharCode(115, 107, 95, 108, 105, 118, 101, 95)}FIXTURESECRETVALUE1234567890`;
}

const FIXTURE_SECRET = fixtureStripeLikeSecret();
const FIXTURE_EMAIL = "owner.personal@personal-domain.test";

function createSyntheticRepo() {
  const repoRoot = mkdtempSync(join(tmpdir(), "cited-publication-check-"));
  execFileSync("git", ["init"], { cwd: repoRoot, stdio: "ignore" });
  execFileSync("git", ["config", "user.email", "test@example.com"], {
    cwd: repoRoot,
    stdio: "ignore",
  });
  execFileSync("git", ["config", "user.name", "Publication Check Test"], {
    cwd: repoRoot,
    stdio: "ignore",
  });
  return repoRoot;
}

function writeAndTrack(repoRoot: string, relativePath: string, content: string) {
  const absolutePath = join(repoRoot, relativePath);
  mkdirSync(join(absolutePath, ".."), { recursive: true });
  writeFileSync(absolutePath, content, "utf8");
  execFileSync("git", ["add", relativePath], { cwd: repoRoot, stdio: "ignore" });
}

function commitAll(repoRoot: string, message = "test snapshot") {
  execFileSync("git", ["commit", "-m", message], { cwd: repoRoot, stdio: "ignore" });
}

function writePolicy(repoRoot: string, policy: Record<string, unknown>) {
  writeAndTrack(
    repoRoot,
    "config/publication-policy.json",
    `${JSON.stringify(policy, null, 2)}\n`,
  );
}

function basePolicy(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: "1",
    repository: "synthetic",
    defaultVisibility: "private",
    publicReleaseBlocked: false,
    requiredChecks: ["policy-valid"],
    forbiddenTrackedPaths: [
      {
        id: "forbidden-dir",
        path: "research/cited-outreach",
        match: "prefix",
        reason: "Forbidden research path.",
      },
    ],
    forbiddenFilenamePatterns: [
      {
        id: "env-file",
        pattern: "^\\.env(?!\\.example$)",
        reason: "Tracked env file.",
      },
    ],
    sensitiveContentPatterns: [
      {
        id: "stripe-live-secret",
        pattern: "sk_live_[A-Za-z0-9]{16,}",
        reason: "Stripe live secret pattern.",
      },
    ],
    sensitiveContentAllowlistPaths: ["config/publication-policy.json"],
    personalEmailConfigPaths: [".env.example"],
    personalEmailAllowlistDomains: ["example.com", "cited.cc"],
    mcpConfigPaths: [".mcp.json"],
    mcpPrivateReferencePatterns: [
      {
        id: "supabase-project-ref",
        pattern: "project_ref=[a-z0-9]+",
        reason: "Private MCP project reference.",
      },
    ],
    doNotPublishMarkers: ["do not publish externally"],
    manualReviewPaths: [
      {
        id: "manual-runbook",
        path: "docs/runbook-",
        match: "path-prefix",
        reason: "Manual review required.",
      },
    ],
    allowedPublicAreas: ["app/"],
    notes: ["Synthetic test policy."],
    ...overrides,
  };
}

function listTracked(repoRoot: string) {
  return execFileSync("git", ["ls-files"], {
    cwd: repoRoot,
    encoding: "utf8",
  })
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const tempRepos: string[] = [];

afterEach(() => {
  while (tempRepos.length > 0) {
    const repoRoot = tempRepos.pop();
    if (repoRoot) {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  }
});

describe("publication readiness policy", () => {
  it("parses a valid policy", () => {
    const policyPath = join(process.cwd(), "config/publication-policy.json");
    const policy = validatePolicyShape(readPolicyFile(policyPath));
    expect(policy.repository).toBe("cited-open-source");
    expect(policy.defaultVisibility).toBe("private");
    expect(policy.publicReleaseBlocked).toBe(true);
  });

  it("fails closed when policy is missing", () => {
    const repoRoot = createSyntheticRepo();
    tempRepos.push(repoRoot);

    const result = runPublicationCheck({
      repoRoot,
      policyPath: join(repoRoot, "config/publication-policy.json"),
      trackedFiles: [],
    });

    expect(result.ok).toBe(false);
    expect(result.findings[0]?.ruleId).toBe("policy-invalid");
  });

  it("fails closed when policy is malformed", () => {
    const repoRoot = createSyntheticRepo();
    tempRepos.push(repoRoot);

    mkdirSync(join(repoRoot, "config"), { recursive: true });
    writeFileSync(
      join(repoRoot, "config/publication-policy.json"),
      "{ not-json",
      "utf8",
    );

    const result = runPublicationCheck({
      repoRoot,
      policyPath: join(repoRoot, "config/publication-policy.json"),
      trackedFiles: [],
    });

    expect(result.ok).toBe(false);
    expect(result.findings[0]?.ruleId).toBe("policy-invalid");
  });

  it("fails when publicReleaseBlocked is true", () => {
    const repoRoot = createSyntheticRepo();
    tempRepos.push(repoRoot);
    writePolicy(repoRoot, basePolicy({ publicReleaseBlocked: true }));

    const result = runPublicationCheck({
      repoRoot,
      policyPath: join(repoRoot, "config/publication-policy.json"),
    });

    expect(result.ok).toBe(false);
    expect(result.blocking.some((finding) => finding.ruleId === "release-blocked")).toBe(
      true,
    );
  });
});

describe("legal foundation checks", () => {
  it("validates AGPL license markers in LICENSE", () => {
    const repoRoot = createSyntheticRepo();
    tempRepos.push(repoRoot);

    writeAndTrack(
      repoRoot,
      "LICENSE",
      "GNU AFFERO GENERAL PUBLIC LICENSE\nVersion 3, 19 November 2007\nGNU Affero General Public License\n",
    );
    commitAll(repoRoot);

    const findings = evaluateLicensePresent(repoRoot);
    expect(findings).toHaveLength(0);
  });

  it("requires package.json license and private flag", () => {
    const repoRoot = createSyntheticRepo();
    tempRepos.push(repoRoot);

    writeAndTrack(
      repoRoot,
      "package.json",
      `${JSON.stringify({ name: "test", private: true, license: "AGPL-3.0-only" }, null, 2)}\n`,
    );
    commitAll(repoRoot);

    const findings = evaluatePackageLicenseMetadata(repoRoot);
    expect(findings).toHaveLength(0);
  });

  it("detects missing legal foundation files", () => {
    const repoRoot = createSyntheticRepo();
    tempRepos.push(repoRoot);

    const findings = evaluateLegalFoundationDocs(repoRoot);
    expect(findings.some((finding) => finding.ruleId === "legal-foundation-missing")).toBe(
      true,
    );
  });

  it("detects forbidden commercial license misrepresentations", () => {
    const repoRoot = createSyntheticRepo();
    tempRepos.push(repoRoot);

    writeAndTrack(
      repoRoot,
      "README.md",
      "All commercial use requires a paid license.\n",
    );
    commitAll(repoRoot);

    const findings = evaluateLicenseClaimHygiene(repoRoot);
    expect(findings.some((finding) => finding.ruleId === "commercial-use-prohibited")).toBe(
      true,
    );
  });

  it("passes legal foundation checks in the real repository", () => {
    const repoRoot = process.cwd();
    expect(evaluateLicensePresent(repoRoot)).toHaveLength(0);
    expect(evaluatePackageLicenseMetadata(repoRoot)).toHaveLength(0);
    expect(evaluateLegalFoundationDocs(repoRoot)).toHaveLength(0);
    expect(evaluateLicenseClaimHygiene(repoRoot)).toHaveLength(0);
  });
});

describe("publication readiness scanner", () => {
  it("detects forbidden tracked paths", () => {
    const repoRoot = createSyntheticRepo();
    tempRepos.push(repoRoot);
    writePolicy(repoRoot, basePolicy());
    writeAndTrack(repoRoot, "research/cited-outreach/prospects.json", "{}");
    commitAll(repoRoot);

    const result = runPublicationCheck({
      repoRoot,
      policyPath: join(repoRoot, "config/publication-policy.json"),
    });

    expect(result.blocking.some((finding) => finding.ruleId === "forbidden-dir")).toBe(
      true,
    );
  });

  it("detects forbidden filenames", () => {
    const repoRoot = createSyntheticRepo();
    tempRepos.push(repoRoot);
    writePolicy(repoRoot, basePolicy());
    writeAndTrack(repoRoot, ".env.production", "NODE_ENV=production\n");
    commitAll(repoRoot);

    const result = runPublicationCheck({
      repoRoot,
      policyPath: join(repoRoot, "config/publication-policy.json"),
    });

    expect(result.blocking.some((finding) => finding.ruleId === "env-file")).toBe(true);
  });

  it("detects suspicious content without leaking the match", () => {
    const repoRoot = createSyntheticRepo();
    tempRepos.push(repoRoot);
    writePolicy(repoRoot, basePolicy());
    writeAndTrack(repoRoot, "lib/demo.ts", `const key = "${FIXTURE_SECRET}";\n`);
    commitAll(repoRoot);

    const result = runPublicationCheck({
      repoRoot,
      policyPath: join(repoRoot, "config/publication-policy.json"),
    });

    const serialized = JSON.stringify(result.findings);
    expect(result.blocking.some((finding) => finding.ruleId === "stripe-live-secret")).toBe(
      true,
    );
    expect(serialized.includes(FIXTURE_SECRET)).toBe(false);
  });

  it("detects personal emails without printing the address", () => {
    const repoRoot = createSyntheticRepo();
    tempRepos.push(repoRoot);
    writePolicy(repoRoot, basePolicy());
    writeAndTrack(
      repoRoot,
      ".env.example",
      `CONTACT=${FIXTURE_EMAIL}\nPUBLIC=hello@cited.cc\n`,
    );
    commitAll(repoRoot);

    const result = runPublicationCheck({
      repoRoot,
      policyPath: join(repoRoot, "config/publication-policy.json"),
    });

    const serialized = JSON.stringify(result.findings);
    expect(
      result.blocking.some((finding) => finding.ruleId === "personal-email-in-config"),
    ).toBe(true);
    expect(serialized.includes(FIXTURE_EMAIL)).toBe(false);
  });

  it("emits manual-review warnings without treating them as passes", () => {
    const repoRoot = createSyntheticRepo();
    tempRepos.push(repoRoot);
    writePolicy(repoRoot, basePolicy());
    writeAndTrack(repoRoot, "docs/runbook-billing.md", "# Billing runbook\n");
    commitAll(repoRoot);

    const result = runPublicationCheck({
      repoRoot,
      policyPath: join(repoRoot, "config/publication-policy.json"),
    });

    expect(result.warnings.some((finding) => finding.ruleId === "manual-runbook")).toBe(
      true,
    );
    expect(result.ok).toBe(true);
  });

  it("passes a clean synthetic repository when release is not blocked", () => {
    const repoRoot = createSyntheticRepo();
    tempRepos.push(repoRoot);
    writePolicy(repoRoot, basePolicy());
    writeAndTrack(repoRoot, "app/page.tsx", "export default function Page() { return null; }\n");
    commitAll(repoRoot);

    const result = runPublicationCheck({
      repoRoot,
      policyPath: join(repoRoot, "config/publication-policy.json"),
    });

    expect(result.blocking).toHaveLength(0);
    expect(result.ok).toBe(true);
  });

  it("does not modify files in the repository", () => {
    const repoRoot = createSyntheticRepo();
    tempRepos.push(repoRoot);
    writePolicy(repoRoot, basePolicy({ publicReleaseBlocked: true }));
    writeAndTrack(repoRoot, "research/cited-outreach/data.json", "{}\n");
    commitAll(repoRoot);

    const before = readFileSync(
      join(repoRoot, "research/cited-outreach/data.json"),
      "utf8",
    );

    runPublicationCheck({
      repoRoot,
      policyPath: join(repoRoot, "config/publication-policy.json"),
    });

    const after = readFileSync(
      join(repoRoot, "research/cited-outreach/data.json"),
      "utf8",
    );
    expect(after).toBe(before);
  });

  it("CLI output never contains fixture secret values", () => {
    const repoRoot = createSyntheticRepo();
    tempRepos.push(repoRoot);

    writePolicy(
      repoRoot,
      basePolicy({
        publicReleaseBlocked: true,
        forbiddenTrackedPaths: [],
      }),
    );
    writeAndTrack(repoRoot, "lib/demo.ts", `const key = "${FIXTURE_SECRET}";\n`);
    commitAll(repoRoot);

    const checkerSource = readFileSync(
      join(process.cwd(), "scripts/check-publication-readiness.mjs"),
      "utf8",
    );
    mkdirSync(join(repoRoot, "scripts"), { recursive: true });
    mkdirSync(join(repoRoot, "lib/publication"), { recursive: true });
    writeFileSync(
      join(repoRoot, "lib/publication/readiness.mjs"),
      readFileSync(join(process.cwd(), "lib/publication/readiness.mjs"), "utf8"),
      "utf8",
    );
    writeFileSync(join(repoRoot, "scripts/check-publication-readiness.mjs"), checkerSource, "utf8");

    const cli = spawnSync(
      "node",
      ["scripts/check-publication-readiness.mjs"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );

    const output = `${cli.stdout}${cli.stderr}`;
    expect(cli.status).not.toBe(0);
    expect(output.includes(FIXTURE_SECRET)).toBe(false);
    expect(output.includes("release-blocked") || output.includes("stripe-live-secret")).toBe(
      true,
    );
  });
});

describe("evaluatePublicationReadiness direct checks", () => {
  it("detects MCP private references and do-not-publish markers", () => {
    const policy = basePolicy();
    const repoRoot = createSyntheticRepo();
    tempRepos.push(repoRoot);
    writeAndTrack(
      repoRoot,
      ".mcp.json",
      '{"url":"https://mcp.supabase.com/mcp?project_ref=abc123xyz"}\n',
    );
    writeAndTrack(repoRoot, "docs/internal.md", "# Internal\nDo not publish externally\n");
    writeAndTrack(repoRoot, "app/page.tsx", "export default function Page() { return null; }\n");
    commitAll(repoRoot);

    const findings = evaluatePublicationReadiness(
      policy,
      repoRoot,
      listTracked(repoRoot),
    );

    expect(findings.some((finding) => finding.ruleId === "supabase-project-ref")).toBe(
      true,
    );
    expect(findings.some((finding) => finding.ruleId === "do-not-publish-marker")).toBe(
      true,
    );
  });
});
