import { describe, expect, it } from "vitest";

import {
  classifyLicense,
  evaluateDependencyLicenses,
  normalizeLicenseTokens,
  resolveDirectDependencyFromLockfile,
} from "../lib/license/dependency-licenses.mjs";

describe("dependency license classification", () => {
  it("normalizes compound license strings", () => {
    expect(normalizeLicenseTokens("Apache-2.0 AND MIT")).toEqual([
      "Apache-2.0",
      "MIT",
    ]);
    expect(normalizeLicenseTokens("(MIT OR Apache-2.0)")).toEqual([
      "MIT",
      "Apache-2.0",
    ]);
  });

  it("classifies permissive licenses", () => {
    const result = classifyLicense("MIT");
    expect(result.category).toBe("permissive");
  });

  it("flags missing licenses for review", () => {
    const result = classifyLicense("");
    expect(result.category).toBe("review-required");
  });

  it("blocks SSPL by default", () => {
    const result = classifyLicense("SSPL-1.0");
    expect(result.category).toBe("disallowed");
  });

  it("flags GPL-family licenses for copyleft review", () => {
    const result = classifyLicense("GPL-3.0-only");
    expect(result.category).toBe("copyleft-review");
  });

  it("flags unknown licenses for review", () => {
    const result = classifyLicense("Proprietary-License-XYZ");
    expect(result.category).toBe("review-required");
  });
});

describe("evaluateDependencyLicenses", () => {
  it("resolves direct dependencies from lockfile packages", () => {
    const lockfile = {
      packages: {
        "node_modules/example-lib": {
          version: "1.2.3",
          license: "MIT",
        },
      },
    };

    const resolved = resolveDirectDependencyFromLockfile("example-lib", lockfile);
    expect(resolved).toEqual({ version: "1.2.3", license: "MIT" });
  });

  it("passes when direct dependencies are permissive", () => {
    const packageJson = {
      dependencies: {
        "example-lib": "^1.0.0",
      },
    };
    const lockfile = {
      packages: {
        "node_modules/example-lib": {
          version: "1.0.0",
          license: "Apache-2.0",
        },
      },
    };

    const result = evaluateDependencyLicenses({ packageJson, lockfile });
    expect(result.ok).toBe(true);
    expect(result.blocking).toHaveLength(0);
  });

  it("fails on disallowed licenses unless allowlisted", () => {
    const packageJson = {
      dependencies: {
        "blocked-lib": "^1.0.0",
      },
    };
    const lockfile = {
      packages: {
        "node_modules/blocked-lib": {
          version: "1.0.0",
          license: "SSPL-1.0",
        },
      },
    };

    const result = evaluateDependencyLicenses({ packageJson, lockfile });
    expect(result.ok).toBe(false);
    expect(result.blocking.some((finding) => finding.name === "blocked-lib")).toBe(
      true,
    );
  });

  it("honors allowlist entries with written reasons", () => {
    const packageJson = {
      dependencies: {
        "blocked-lib": "^1.0.0",
      },
    };
    const lockfile = {
      packages: {
        "node_modules/blocked-lib": {
          version: "1.0.0",
          license: "SSPL-1.0",
        },
      },
    };

    const result = evaluateDependencyLicenses({
      packageJson,
      lockfile,
      allowlist: {
        "blocked-lib": { reason: "Documented exception for test fixture only." },
      },
    });

    expect(result.ok).toBe(true);
  });
});

describe("runLicenseCheck integration", () => {
  it("passes for the repository direct dependencies", async () => {
    const { runLicenseCheck } = await import("../lib/license/dependency-licenses.mjs");
    const result = runLicenseCheck(process.cwd());
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.ok).toBe(true);
  });
});
