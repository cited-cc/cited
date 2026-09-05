import { describe, expect, it } from "vitest";

import {
  dnsTxtHostLabel,
  flattenTxtRecords,
  formatDnsTxtValue,
  generateVerificationToken,
  matchVerificationToken,
} from "@/lib/domains/verify-dns-txt";
import {
  normalizeBrandName,
  parseAlternateNames,
} from "@/lib/domains/domain-service";
import {
  assertValidStepTransition,
  normalizePromptText,
  validatePromptText,
} from "@/lib/onboarding/onboarding-service";
import {
  slugifyWorkspaceName,
  validateWorkspaceName,
} from "@/lib/workspaces/provision-workspace";
import { normalizeHostname } from "@/lib/citations/normalize";
import {
  sanitizeProductEventPayload,
} from "@/lib/analytics/product";
import { canUseFrequency, canUseSurface } from "@/lib/entitlements/plan-entitlements";

describe("DNS TXT helpers", () => {
  it("generates opaque tokens and formats values", () => {
    const token = generateVerificationToken();
    expect(token.length).toBeGreaterThanOrEqual(32);
    expect(formatDnsTxtValue(token)).toBe(`cited-verification=${token}`);
  });

  it("computes host labels for apex and subdomains", () => {
    expect(dnsTxtHostLabel("example.com", "example.com")).toBe("@");
    expect(dnsTxtHostLabel("blog.example.com", "example.com")).toBe("blog");
  });

  it("matches and rejects TXT records", () => {
    const token = "abc123";
    const value = formatDnsTxtValue(token);
    expect(matchVerificationToken([value], token)).toBe("match");
    expect(matchVerificationToken([formatDnsTxtValue("other")], token)).toBe(
      "mismatch",
    );
    expect(matchVerificationToken(["unrelated"], token)).toBe("not_found");
    expect(flattenTxtRecords([["cited-", "verification=abc123"]])).toEqual([
      "cited-verification=abc123",
    ]);
  });
});

describe("domain and brand parsing", () => {
  it("normalizes domains and rejects paths as stored host", () => {
    expect(normalizeHostname("https://www.Example.com/path")).toBe(
      "example.com",
    );
  });

  it("parses alternate names with dedupe and limits", () => {
    expect(
      parseAlternateNames("Example, example, Example.com, <bad>, "),
    ).toEqual(["Example", "Example.com"]);
    expect(normalizeBrandName("  Acme  ")).toBe("Acme");
  });
});

describe("onboarding validation", () => {
  it("guards step transitions", () => {
    expect(() => assertValidStepTransition(1, 2)).not.toThrow();
    expect(() => assertValidStepTransition(1, 1)).not.toThrow();
    expect(() => assertValidStepTransition(2, 1)).not.toThrow();
    expect(() => assertValidStepTransition(1, 3)).toThrow();
  });

  it("validates workspace names and prompts", () => {
    expect(validateWorkspaceName("My Cited workspace")).toBe(
      "My Cited workspace",
    );
    expect(() => validateWorkspaceName("x")).toThrow();
    expect(slugifyWorkspaceName("My Cited Workspace")).toBe(
      "my-cited-workspace",
    );
    expect(validatePromptText("Best tools for SEO")).toBe(
      "Best tools for SEO",
    );
    expect(normalizePromptText("  Best   Tools ")).toBe("best tools");
    expect(() => validatePromptText("ab")).toThrow();
  });

  it("enforces surface and cadence entitlements", () => {
    expect(canUseSurface("founder", "chatgpt")).toBe(true);
    expect(canUseSurface("founder", "claude")).toBe(false);
    expect(canUseFrequency("founder", "twice_weekly")).toBe(true);
    expect(canUseFrequency("founder", "daily")).toBe(false);
    expect(canUseFrequency("pro", "daily")).toBe(true);
  });
});

describe("analytics payload hygiene", () => {
  it("strips PII-like fields and values", () => {
    expect(
      sanitizeProductEventPayload({
        route: "/onboarding",
        plan: "founder",
        step: 2,
        email: "a@example.com",
      }),
    ).toEqual({ route: "/onboarding", plan: "founder", step: 2 });

    expect(
      sanitizeProductEventPayload({
        route: "cs_test_123",
        reason: "mismatch",
      }),
    ).toEqual({ reason: "mismatch" });
  });
});
