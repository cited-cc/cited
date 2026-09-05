import { describe, expect, it } from "vitest";

import { formatStarCount } from "@/lib/github/format-star-count";

describe("formatStarCount", () => {
  it("formats small counts with grouping", () => {
    expect(formatStarCount(42)).toBe("42");
    expect(formatStarCount(999)).toBe("999");
  });

  it("formats thousands compactly", () => {
    expect(formatStarCount(1200)).toBe("1.2k");
    expect(formatStarCount(10000)).toBe("10k");
  });

  it("formats millions compactly", () => {
    expect(formatStarCount(1_500_000)).toBe("1.5M");
  });
});
