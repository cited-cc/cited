import { describe, expect, it } from "vitest";

import {
  extractHostname,
  MAX_URL_LENGTH,
  normalizeUrl,
} from "@/lib/citations/normalize";

describe("adversarial domain and URL handling", () => {
  it("rejects credential-bearing URLs", () => {
    expect(extractHostname("https://user:pass@example.com/path")).toBeNull();
    expect(() => normalizeUrl("https://secret:token@example.com/a")).toThrow();
  });

  it("rejects javascript and data schemes", () => {
    expect(extractHostname("javascript:alert(1)")).toBeNull();
    expect(extractHostname("data:text/html,hello")).toBeNull();
  });

  it("rejects overlong inputs", () => {
    const long = `https://example.com/${"a".repeat(MAX_URL_LENGTH)}`;
    expect(extractHostname(long)).toBeNull();
  });

  it("does not treat deceptive suffix hosts as equal", () => {
    expect(extractHostname("https://example.com.attacker.test")).toBe(
      "example.com.attacker.test",
    );
  });
});
