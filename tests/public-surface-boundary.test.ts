import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("public surface boundary", () => {
  it("rejects cloud deployment mode in community edition", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/deployment/mode.ts"),
      "utf8",
    );
    expect(source).toContain("community edition");
    expect(source).toContain('parsed === "cloud"');
  });

  it("does not ship forbidden cloud directories", () => {
    const forbidden = [
      "lib/billing",
      "lib/chatbot",
      "lib/scan",
      "components/billing",
      "components/chatbot",
    ];
    for (const dir of forbidden) {
      expect(() => readFileSync(join(process.cwd(), dir), "utf8")).toThrow();
    }
  });

  it("documents distribution boundary", () => {
    const doc = readFileSync(
      join(process.cwd(), "docs/open-source/distribution-boundary.md"),
      "utf8",
    );
    expect(doc).toContain("AGPL-3.0-only");
    expect(doc).toContain("cited.cc");
    expect(doc).not.toContain("do not publish externally");
  });
});
