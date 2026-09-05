import { describe, expect, it } from "vitest";

import {
  buildScanResultSummary,
  parseCitationsSnapshot,
  parseProviderMetadata,
  parseScanRunInsight,
  serializeAnswerSources,
  serializeCitationsSnapshot,
  serializeProviderMetadata,
} from "@/lib/evidence/provider-visibility";
import type { NormalizedAiResult } from "@/lib/monitoring/types";

function sampleResult(
  overrides: Partial<NormalizedAiResult> = {},
): NormalizedAiResult {
  return {
    provider: "dataforseo",
    aiSurface: "chatgpt",
    prompt: "best ai seo tools",
    responseText: "Example answer with citations.",
    location: { languageCode: "en", countryCode: "US" },
    citations: [
      {
        url: "https://cited-test.example/guide",
        normalizedUrl: "https://cited-test.example/guide",
        hostname: "cited-test.example",
        title: "Guide",
        snippet: "Helpful guide",
        position: 1,
      },
      {
        url: "https://competitor-labs.example/review",
        normalizedUrl: "https://competitor-labs.example/review",
        hostname: "competitor-labs.example",
        title: "Review",
        position: 2,
      },
    ],
    mentionCandidates: [],
    completedAt: new Date("2026-07-08T12:00:00.000Z"),
    providerCostType: "actual",
    providerCostUsd: 0.0025,
    rawPayload: {},
    metadata: {
      inputTokens: 120,
      outputTokens: 340,
      webSearch: true,
    },
    ...overrides,
  };
}

describe("provider visibility serialization", () => {
  it("round-trips citations snapshot", () => {
    const result = sampleResult();
    const snapshot = serializeCitationsSnapshot(result.citations);
    const parsed = parseCitationsSnapshot(snapshot);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.hostname).toBe("cited-test.example");
    expect(parsed[1]?.position).toBe(2);
  });

  it("serializes provider metadata from normalized result", () => {
    const metadata = parseProviderMetadata(serializeProviderMetadata(sampleResult()));
    expect(metadata?.inputTokens).toBe(120);
    expect(metadata?.outputTokens).toBe(340);
    expect(metadata?.webSearch).toBe(true);
    expect(metadata?.providerCostUsd).toBe(0.0025);
  });

  it("tags answer sources by domain relation", () => {
    const sources = serializeAnswerSources({
      citations: sampleResult().citations,
      verifiedHostname: "cited-test.example",
      approvedAliases: [],
      competitorHostnames: ["competitor-labs.example"],
    });
    expect(sources[0]?.relation).toBe("your_domain");
    expect(sources[1]?.relation).toBe("competitor");
  });

  it("builds scan result summary with provider metadata", () => {
    const summary = buildScanResultSummary({
      result: sampleResult(),
      eventCount: 1,
      eventsCreated: 1,
      eventsUpdated: 0,
      occurrencesCreated: 1,
    });
    expect(summary.citationCount).toBe(2);
    expect(summary.inputTokens).toBe(120);
    expect(summary.providerCostUsd).toBe(0.0025);
  });

  it("parses scan run insight from result summary", () => {
    const insight = parseScanRunInsight(
      {
        citationCount: 4,
        eventCount: 0,
        modelName: "gpt-4o",
        missingAiOverview: true,
      },
      { inputTokens: 50, outputTokens: 90 },
      0,
    );
    expect(insight?.citationCount).toBe(4);
    expect(insight?.eventCount).toBe(0);
    expect(insight?.missingAiOverview).toBe(true);
    expect(insight?.inputTokens).toBe(50);
  });
});
