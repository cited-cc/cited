import { describe, expect, it } from "vitest";

import {
  normalizePromptText,
  validatePromptText,
} from "@/lib/onboarding/onboarding-service";

describe("create monitor validation", () => {
  it("normalizes prompt text for duplicate detection", () => {
    expect(normalizePromptText("  Best   AI   Tools ")).toBe("best ai tools");
  });

  it("rejects prompts that are too short", () => {
    expect(() => validatePromptText("ab")).toThrow();
  });

  it("accepts valid prompt text", () => {
    expect(validatePromptText("What are the best AI SEO tools?")).toBe(
      "What are the best AI SEO tools?",
    );
  });
});
