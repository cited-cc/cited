import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("billing boundary check script", () => {
  it("passes in the current repository", () => {
    const output = execFileSync("node", ["scripts/check-billing-boundaries.mjs"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    expect(output.trim()).toBe("billing-check: PASS");
  });
});
