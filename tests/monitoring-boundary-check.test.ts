import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";

describe("monitoring boundary check script", () => {
  it("passes offline monitoring boundary checks", () => {
    const output = execFileSync("node", ["scripts/check-monitoring-boundaries.mjs"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    expect(output).toContain("monitoring:check ok");
  });
});
