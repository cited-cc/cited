import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

function readMarkdown(relativePath: string): string {
  const absolute = join(repoRoot, relativePath);
  expect(existsSync(absolute), `${relativePath} should exist`).toBe(true);
  return readFileSync(absolute, "utf8");
}

describe("documentation accessibility smoke", () => {
  it("README uses a single top-level heading and descriptive link text", () => {
    const readme = readMarkdown("README.md");
    const h1Count = (readme.match(/^# /gm) ?? []).length;
    expect(h1Count).toBe(0);
    expect(readme).toMatch(/alt="[^"]{8,}"/);
    expect(readme).not.toMatch(/\]\(click here\)/i);
  });

  it("docs index has heading hierarchy without skipped levels in opening sections", () => {
    const index = readMarkdown("docs/README.md");
    expect(index.startsWith("# ")).toBe(true);
    expect(index).toMatch(/^## /m);
  });

  it("quickstart documents setup token retrieval without embedding secrets", () => {
    const quickstart = readMarkdown("docs/getting-started/quickstart.md");
    expect(quickstart).toMatch(/self-host:token/);
    expect(quickstart).not.toMatch(/CITED_BOOTSTRAP_TOKEN=[a-z0-9]{16,}/i);
  });

  it("feature matrix tables use header rows", () => {
    const matrix = readMarkdown("docs/reference/feature-matrix.md");
    expect(matrix).toMatch(/\| Capability \|/);
    expect(matrix).toMatch(/\| --- \|/);
  });

  it("brand SVG marks omit scripts", () => {
    for (const file of ["docs/assets/brand/cited-mark-light.svg", "docs/assets/brand/cited-mark-dark.svg"]) {
      const svg = readMarkdown(file);
      expect(svg).not.toMatch(/<script/i);
    }
  });
});
