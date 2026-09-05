import { describe, expect, it } from "vitest";

import {
  formatProviderText,
  normalizeProviderText,
} from "@/lib/evidence/provider-text";

describe("provider text formatting", () => {
  it("strips markdown headings and emphasis", () => {
    const raw =
      "## AI citation monitoring\n\n**Cited Test Brand** appears when buyers ask for tools.";
    const text = normalizeProviderText(raw);

    expect(text).not.toContain("##");
    expect(text).not.toContain("**");
    expect(text).toContain("AI citation monitoring");
    expect(text).toContain("Cited Test Brand appears when buyers ask for tools.");
  });

  it("normalizes bullet and numbered lists", () => {
    const raw = "- First option\n- Second option\n\n1. Step one\n2. Step two";
    const { text, blocks } = formatProviderText(raw);

    expect(text).toContain("- First option");
    expect(text).toContain("1. Step one");
    expect(blocks.some((block) => block.kind === "unordered-list")).toBe(true);
    expect(blocks.some((block) => block.kind === "ordered-list")).toBe(true);
  });

  it("converts markdown links to link text", () => {
    const text = normalizeProviderText(
      "See [Cited](https://cited.cc) for monitoring.",
    );
    expect(text).toBe("See Cited for monitoring.");
  });

  it("maps block offsets to flattened text", () => {
    const { text, blocks } = formatProviderText("## Title\n\nBody copy.");
    const heading = blocks.find((block) => block.kind === "heading");
    const paragraph = blocks.find((block) => block.kind === "paragraph");

    expect(heading?.text).toBe("Title");
    expect(paragraph?.text).toBe("Body copy.");
    expect(text.slice(heading!.start, heading!.end)).toBe("Title");
    expect(text.slice(paragraph!.start, paragraph!.end)).toBe("Body copy.");
  });

  it("is idempotent on already-normalized text", () => {
    const once = normalizeProviderText("Plain paragraph.\n\n- One\n- Two");
    const twice = normalizeProviderText(once);
    expect(twice).toBe(once);
  });
});
