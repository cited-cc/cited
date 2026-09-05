import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Guardrails: demo fixtures must not import DataForSEO client.
 */
describe("demo and public provider isolation", () => {
  const root = process.cwd();

  it("demo fixtures do not import DataForSEO", () => {
    const files = [
      "lib/demo/demo-events.ts",
      "lib/demo/demo-notes.ts",
      "lib/demo/demo-monitors.ts",
    ];
    for (const file of files) {
      const source = readFileSync(join(root, file), "utf8");
      expect(source).not.toMatch(/dataforseo/i);
      expect(source).not.toMatch(/createMonitoringProvider/);
      expect(source).not.toMatch(/DATAFORSEO_/);
    }
  });

  it("DataForSEO client is server-module under providers/", () => {
    const source = readFileSync(
      join(root, "lib/providers/dataforseo/client.ts"),
      "utf8",
    );
    expect(source).toContain("DataForSeoCitationMonitoringProvider");
    expect(source).toMatch(/[Ss]erver-only/);
  });
});
