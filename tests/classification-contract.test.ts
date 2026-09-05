import { describe, expect, it } from "vitest";

import { toClassificationResult } from "@/lib/classification";
import { classifyNormalizedResult } from "@/lib/classification";
import type { NormalizedAiResult } from "@/lib/monitoring/types";

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

describe("classification result contract", () => {
  it("returns explainable reason codes and confidence labels", () => {
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
    const citation = events.find((e) => e.eventType === "citation");
    expect(citation).toBeTruthy();
    const typed = toClassificationResult(citation!, ["ev-1"]);
    expect(typed.eventType).toBe("citation");
    expect(typed.reasonCode).toBe("exact_domain_citation");
    expect(typed.confidenceLabel).toBe("exact");
    expect(typed.evidenceIds).toEqual(["ev-1"]);
  });

  it("scopes missed opportunity to monitored result only", () => {
    const events = classifyNormalizedResult(
      result({
        responseText: "Competitor Labs is useful.",
        citations: [
          {
            url: "https://competitor-labs.example/page",
            normalizedUrl: "https://competitor-labs.example/page",
            hostname: "competitor-labs.example",
            position: 1,
          },
        ],
      }),
      context,
    );
    const missed = events.find((e) => e.eventType === "missed_opportunity");
    expect(missed?.metadata?.scope).toBe("monitored_result_only");
    expect(missed?.metadata?.reasonCode).toBe(
      "missed_opportunity_competitor_present",
    );
  });
});
