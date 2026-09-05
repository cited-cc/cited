import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

describe("deployment boundary checker", () => {
  it("passes on the repository tree", () => {
    const repoRoot = join(import.meta.dirname, "..");
    const output = execFileSync("node", ["scripts/check-deployment-boundaries.mjs"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    expect(output.trim()).toBe("deployment-check: PASS");
  });
});
