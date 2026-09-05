import { describe, expect, it } from "vitest";

import { matchCompetitor } from "@/lib/classification/match-competitor";
import { classifyNormalizedResult } from "@/lib/classification/classify-citation-event";
import {
  dedupeHostnames,
  isDomainMatch,
  normalizeHostname,
} from "@/lib/citations/normalize";
import { normalizeCompetitorInput } from "@/lib/monitoring/load-competitors";
import type { NormalizedAiResult } from "@/lib/monitoring/types";

describe("competitor domain normalization", () => {
  it("dedupes and normalizes competitor hostnames", () => {
    expect(
      dedupeHostnames([
        "WWW.Competitor-Labs.example",
        "competitor-labs.example",
      ]),
    ).toEqual(["competitor-labs.example"]);
  });

  it("rejects primary brand as competitor", () => {
    expect(
      normalizeCompetitorInput({
        hostname: "cited-test.example",
        verifiedHostname: "cited-test.example",
      }),
    ).toBeNull();
  });

  it("matches competitor subdomain safely", () => {
    expect(
      matchCompetitor("www.competitor-labs.example", [
        "competitor-labs.example",
      ]),
    ).toBe("competitor-labs.example");
  });

  it("does not match suffix attacks", () => {
    expect(
      matchCompetitor("example.com.evil.test", ["example.com"]),
    ).toBeNull();
    expect(isDomainMatch("example.com.evil.test", "example.com")).toBe(false);
  });

  it("normalizes trailing dots and casing", () => {
    expect(normalizeHostname("Competitor-Labs.EXAMPLE.")).toBe(
      "competitor-labs.example",
    );
  });
});

describe("competitor classification regression", () => {
  const context = {
    workspaceId: "ws-1",
    domainId: "dom-1",
    brandId: "brand-1",
    monitorConfigurationId: "mc-1",
    verifiedHostname: "cited-test.example",
    approvedAliases: [],
    brandNames: ["Cited Test Brand"],
    competitorHostnames: ["competitor-labs.example"],
  };

  const baseResult: NormalizedAiResult = {
    provider: "mock",
    aiSurface: "chatgpt",
    prompt: "Best tools",
    responseText: "Competitor Labs is recommended.",
    location: { languageCode: "en", countryCode: "US" },
    citations: [
      {
        url: "https://competitor-labs.example/product",
        normalizedUrl: "https://competitor-labs.example/product",
        hostname: "competitor-labs.example",
        title: "Competitor",
        position: 1,
      },
    ],
    mentionCandidates: [],
    completedAt: new Date(),
    providerCostType: "unknown",
    rawPayload: { mock: true },
  };

  it("fires competitor and missed opportunity when competitors are wired", () => {
    const events = classifyNormalizedResult(baseResult, context);
    expect(events.some((e) => e.eventType === "competitor_citation")).toBe(true);
    expect(events.some((e) => e.eventType === "missed_opportunity")).toBe(true);
  });

  it("does not fire competitor events when competitor list is empty", () => {
    const events = classifyNormalizedResult(baseResult, {
      ...context,
      competitorHostnames: [],
    });
    expect(events.some((e) => e.eventType === "competitor_citation")).toBe(
      false,
    );
    expect(events.some((e) => e.eventType === "missed_opportunity")).toBe(
      false,
    );
  });
});
