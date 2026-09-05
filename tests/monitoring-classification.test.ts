import { describe, expect, it } from "vitest";

import {
  classifyNormalizedResult,
  findBrandMatches,
} from "@/lib/classification";
import { buildEventFingerprint } from "@/lib/monitoring/hash";
import type { NormalizedAiResult } from "@/lib/monitoring/types";
import { isApprovedDomainMatch, isDomainMatch } from "@/lib/citations/normalize";
import { isUsageSafetyExceeded } from "@/lib/monitoring/usage";

const context = {
  workspaceId: "ws-1",
  domainId: "dom-1",
  brandId: "brand-1",
  monitorConfigurationId: "mc-1",
  verifiedHostname: "cited-test.example",
  approvedAliases: ["docs.cited-test.example"],
  brandNames: ["Cited Test Brand"],
  competitorHostnames: ["competitor-labs.example"],
};

function result(partial: Partial<NormalizedAiResult>): NormalizedAiResult {
  return {
    provider: "mock",
    aiSurface: "chatgpt",
    prompt: "Best tools",
    responseText: "",
    location: { languageCode: "en", countryCode: "US" },
    citations: [],
    mentionCandidates: [],
    completedAt: new Date(),
    providerCostType: "unknown",
    rawPayload: { mock: true },
    ...partial,
  };
}

describe("citation classification", () => {
  it("classifies exact domain citation", () => {
    const events = classifyNormalizedResult(
      result({
        responseText: "See the guide.",
        citations: [
          {
            url: "https://cited-test.example/guides/ai-citations",
            normalizedUrl: "https://cited-test.example/guides/ai-citations",
            hostname: "cited-test.example",
            title: "Guide",
            position: 1,
          },
        ],
      }),
      context,
    );
    expect(events.some((e) => e.eventType === "citation")).toBe(true);
    expect(events.some((e) => e.eventType === "mention")).toBe(false);
  });

  it("matches www variant as same domain", () => {
    expect(
      isDomainMatch("www.cited-test.example", "cited-test.example"),
    ).toBe(true);
  });

  it("matches approved alias subdomain only when configured", () => {
    expect(
      isApprovedDomainMatch(
        "docs.cited-test.example",
        "cited-test.example",
        ["docs.cited-test.example"],
      ),
    ).toBe(true);
    expect(
      isApprovedDomainMatch("blog.cited-test.example", "cited-test.example", []),
    ).toBe(false);
  });

  it("prevents false-positive domain matches", () => {
    expect(isDomainMatch("notexample.com", "example.com")).toBe(false);
    expect(isDomainMatch("example.co", "example.com")).toBe(false);
    expect(
      isDomainMatch("example.com.fake-site.com", "example.com"),
    ).toBe(false);
  });

  it("classifies brand mention without citation", () => {
    const events = classifyNormalizedResult(
      result({
        responseText:
          "Many teams mention Cited Test Brand when discussing monitoring.",
      }),
      context,
    );
    expect(events.some((e) => e.eventType === "mention")).toBe(true);
  });

  it("classifies strong recommendation conservatively", () => {
    const events = classifyNormalizedResult(
      result({
        responseText:
          "Top tools:\n1. Cited Test Brand — best overall\nWe recommend Cited Test Brand for focused evidence.",
      }),
      context,
    );
    expect(events.some((e) => e.eventType === "recommendation")).toBe(true);
  });

  it("does not classify ambiguous strings as brand matches", () => {
    const matches = findBrandMatches(
      "The word cite appears. Citation is important.",
      ["Cited Test Brand"],
    );
    expect(matches.length).toBe(0);
  });

  it("classifies competitor citation and missed opportunity", () => {
    const events = classifyNormalizedResult(
      result({
        responseText: "Competitor Labs is recommended.",
        citations: [
          {
            url: "https://competitor-labs.example/product",
            normalizedUrl: "https://competitor-labs.example/product",
            hostname: "competitor-labs.example",
            title: "Competitor",
            position: 1,
          },
        ],
      }),
      context,
    );
    expect(events.some((e) => e.eventType === "competitor_citation")).toBe(true);
    expect(events.some((e) => e.eventType === "missed_opportunity")).toBe(true);
  });

  it("builds stable fingerprints for recurring events", () => {
    const a = buildEventFingerprint({
      workspaceId: "ws-1",
      domainId: "dom-1",
      monitorConfigurationId: "mc-1",
      aiSurface: "chatgpt",
      eventType: "citation",
      identityKey: "https://cited-test.example/a",
    });
    const b = buildEventFingerprint({
      workspaceId: "ws-1",
      domainId: "dom-1",
      monitorConfigurationId: "mc-1",
      aiSurface: "chatgpt",
      eventType: "citation",
      identityKey: "https://cited-test.example/a",
    });
    const c = buildEventFingerprint({
      workspaceId: "ws-1",
      domainId: "dom-1",
      monitorConfigurationId: "mc-1",
      aiSurface: "gemini",
      eventType: "citation",
      identityKey: "https://cited-test.example/a",
    });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});

describe("usage safety", () => {
  it("blocks at configured safety percent", () => {
    expect(
      isUsageSafetyExceeded({ used: 190, limit: 200, safetyPercent: 95 }),
    ).toBe(true);
    expect(
      isUsageSafetyExceeded({ used: 189, limit: 200, safetyPercent: 95 }),
    ).toBe(false);
  });
});
