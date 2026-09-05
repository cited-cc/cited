import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

describe("provider boundary check script", () => {
  it("passes offline provider boundary checks", () => {
    const output = execFileSync("node", ["scripts/check-provider-boundaries.mjs"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    expect(output).toContain("provider:check ok");
  });

  it("documents canonical provider env vars in examples", () => {
    for (const file of [".env.example", ".env.self-hosted.example"]) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      expect(source).toMatch(/CITED_MONITORING_PROVIDER|MONITORING_PROVIDER/);
    }
  });
});
