import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

describe("database boundary check", () => {
  it("passes repository database guardrails", () => {
    const output = execFileSync("node", ["scripts/check-database-boundaries.mjs"], {
      cwd: join(process.cwd()),
      encoding: "utf8",
    });
    expect(output).toContain("database-check: PASS");
  });
});
