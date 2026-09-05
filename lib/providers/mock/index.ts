import "server-only";

import { normalizeCitationSource } from "@/lib/monitoring/hash";
import { stableHash } from "@/lib/monitoring/schedule";
import type {
  NormalizedAiResult,
  NormalizedScanRequest,
  ProviderPollResult,
  ProviderSubmissionResult,
} from "@/lib/monitoring/types";
import { MOCK_PROVIDER_METADATA } from "@/lib/providers/mock/metadata";
import { validateNormalizedAiResult } from "@/lib/providers/normalization";
import type { MonitoringProvider } from "@/lib/providers/provider";
import type {
  ProviderConfigurationResult,
  ProviderPollRequest,
} from "@/lib/providers/types";

export { MOCK_ADAPTER_VERSION, MOCK_PROVIDER_METADATA } from "@/lib/providers/mock/metadata";

export type MockFixtureKey =
  | "citation_exact"
  | "citation_www"
  | "citation_alias"
  | "mention_only"
  | "recommendation_strong"
  | "mention_ambiguous"
  | "competitor_citation"
  | "missed_opportunity"
  | "no_result"
  | "partial_result"
  | "malformed"
  | "rate_limit"
  | "quota_exhausted"
  | "auth_failure"
  | "timeout"
  | "retryable_5xx";

/**
 * Development and test mock provider. Never used in Cited Cloud production.
 */
export class MockMonitoringProvider implements MonitoringProvider {
  readonly metadata = MOCK_PROVIDER_METADATA;
  readonly name = "mock" as const;

  private readonly fixtureOverride: MockFixtureKey | null;
  private readonly pending = new Map<string, NormalizedScanRequest>();

  constructor(options?: { fixture?: MockFixtureKey }) {
    this.fixtureOverride = options?.fixture ?? null;
  }

  validateConfiguration(): ProviderConfigurationResult {
    return {
      ok: true,
      providerId: "mock",
      ready: true,
      warnings: [
        "Mock provider returns fictional demo data only.",
        "Do not use mock output for production decisions.",
      ],
    };
  }

  async submitScan(
    request: NormalizedScanRequest,
  ): Promise<ProviderSubmissionResult> {
    const fixture = this.resolveFixture(request);

    switch (fixture) {
      case "rate_limit":
        return {
          status: "failed",
          retryable: true,
          code: "provider_rate_limited",
          safeMessage:
            "The monitoring provider is rate limiting requests. Cited will retry shortly.",
          providerStatusCode: 429,
        };
      case "quota_exhausted":
        return {
          status: "failed",
          retryable: false,
          code: "provider_validation_error",
          safeMessage: "The monitoring provider account quota has been exhausted.",
          providerStatusCode: 402,
        };
      case "auth_failure":
        return {
          status: "failed",
          retryable: false,
          code: "provider_validation_error",
          safeMessage: "The monitoring provider rejected the configured credentials.",
          providerStatusCode: 401,
        };
      case "timeout":
        return {
          status: "failed",
          retryable: true,
          code: "provider_timeout",
          safeMessage:
            "The monitoring provider timed out. Cited will retry automatically.",
        };
      case "retryable_5xx":
        return {
          status: "failed",
          retryable: true,
          code: "provider_unavailable",
          safeMessage: "The monitoring provider is temporarily unavailable.",
          providerStatusCode: 503,
        };
      case "malformed":
        return {
          status: "failed",
          retryable: false,
          code: "provider_invalid_response",
          safeMessage: "The monitoring provider returned an unusable response.",
        };
      case "no_result":
        return {
          status: "completed",
          result: this.buildResult(request, {
            responseText:
              "[MOCK DATA] No relevant sources were found for this query.",
            citations: [],
          }),
        };
      case "partial_result": {
        const taskId = `mock_pending_${request.scanRunId}`;
        this.pending.set(taskId, request);
        return {
          status: "pending",
          providerTaskId: taskId,
          pollAfterSeconds: 1,
          providerMetadata: { mock: true, fixture, label: "MOCK DATA" },
        };
      }
      default:
        return {
          status: "completed",
          result: this.buildFixtureResult(request, fixture),
        };
    }
  }

  async pollTask(input: ProviderPollRequest): Promise<ProviderPollResult> {
    const request = this.pending.get(input.providerTaskId) ?? input.request;
    this.pending.delete(input.providerTaskId);
    return {
      status: "completed",
      result: this.buildFixtureResult(request, "citation_exact"),
    };
  }

  private resolveFixture(request: NormalizedScanRequest): MockFixtureKey {
    if (this.fixtureOverride) return this.fixtureOverride;
    const fixtures: MockFixtureKey[] = [
      "citation_exact",
      "citation_www",
      "mention_only",
      "recommendation_strong",
      "competitor_citation",
      "mention_ambiguous",
      "missed_opportunity",
    ];
    const index = stableHash(request.monitorConfigurationId) % fixtures.length;
    return fixtures[index] ?? "citation_exact";
  }

  private buildFixtureResult(
    request: NormalizedScanRequest,
    fixture: MockFixtureKey,
  ): NormalizedAiResult {
    switch (fixture) {
      case "citation_exact":
        return this.buildResult(request, {
          responseText:
            "[MOCK DATA] Cited Test Brand (cited-test.example) is a strong option for AI citation monitoring. Primary source: https://cited-test.example/guides/ai-citations",
          citations: [
            normalizeCitationSource({
              url: "https://cited-test.example/guides/ai-citations",
              title: "[MOCK] AI citation monitoring guide",
              snippet:
                "[MOCK] Cited Test Brand helps teams know when AI cites their domain.",
              position: 1,
            }),
          ].filter(Boolean) as NonNullable<
            ReturnType<typeof normalizeCitationSource>
          >[],
        });
      case "citation_www":
        return this.buildResult(request, {
          responseText:
            "[MOCK DATA] See https://www.cited-test.example/product for details on Cited Test Brand.",
          citations: [
            normalizeCitationSource({
              url: "https://www.cited-test.example/product",
              title: "[MOCK] Product",
              position: 1,
            }),
          ].filter(Boolean) as NonNullable<
            ReturnType<typeof normalizeCitationSource>
          >[],
        });
      case "citation_alias":
        return this.buildResult(request, {
          responseText:
            "[MOCK DATA] Docs live at https://docs.cited-test.example/intro",
          citations: [
            normalizeCitationSource({
              url: "https://docs.cited-test.example/intro",
              title: "[MOCK] Docs",
              position: 1,
            }),
          ].filter(Boolean) as NonNullable<
            ReturnType<typeof normalizeCitationSource>
          >[],
        });
      case "mention_only":
        return this.buildResult(request, {
          responseText:
            "[MOCK DATA] Many teams mention Cited Test Brand when discussing citation monitoring, without linking a source.",
          citations: [],
        });
      case "recommendation_strong":
        return this.buildResult(request, {
          responseText:
            "[MOCK DATA] Top tools for citation monitoring:\n1. Cited Test Brand (best overall)\n2. Other Tool\nWe recommend Cited Test Brand for focused AI citation evidence.",
          citations: [],
        });
      case "mention_ambiguous":
        return this.buildResult(request, {
          responseText:
            "[MOCK DATA] The word cite appears often. Citation is important. This should not match a brand named Cited unless configured carefully.",
          citations: [],
        });
      case "competitor_citation":
        return this.buildResult(request, {
          responseText:
            "[MOCK DATA] Competitor Labs is frequently recommended. Source: https://competitor-labs.example/product",
          citations: [
            normalizeCitationSource({
              url: "https://competitor-labs.example/product",
              title: "[MOCK] Competitor Labs",
              position: 1,
            }),
          ].filter(Boolean) as NonNullable<
            ReturnType<typeof normalizeCitationSource>
          >[],
        });
      case "missed_opportunity":
        return this.buildResult(request, {
          responseText:
            "[MOCK DATA] Several vendors cover AI visibility, but Cited Test Brand is not mentioned in this answer.",
          citations: [
            normalizeCitationSource({
              url: "https://other-vendor.example/overview",
              title: "[MOCK] Other vendor overview",
              position: 1,
            }),
          ].filter(Boolean) as NonNullable<
            ReturnType<typeof normalizeCitationSource>
          >[],
        });
      default:
        return this.buildResult(request, {
          responseText: "[MOCK DATA] Default mock response for Cited Test Brand.",
          citations: [],
        });
    }
  }

  private buildResult(
    request: NormalizedScanRequest,
    input: {
      responseText: string;
      citations: NonNullable<ReturnType<typeof normalizeCitationSource>>[];
    },
  ): NormalizedAiResult {
    const surfaceLabel = request.aiSurface.replaceAll("_", " ");
    const responseText = `[MOCK DATA][${surfaceLabel}] ${input.responseText.replace(/^\[MOCK DATA\]\s?/, "")}`;

    return validateNormalizedAiResult(
      {
        provider: "mock",
        providerTaskId: `mock_${request.scanRunId}`,
        providerRequestId: `mock_req_${request.scanRunId}`,
        aiSurface: request.aiSurface,
        modelName: `mock-${request.aiSurface}-v1`,
        prompt: request.prompt,
        responseText,
        responseLanguage: request.languageCode,
        location: {
          languageCode: request.languageCode,
          countryCode: request.countryCode,
          city: request.city ?? null,
        },
        citations: input.citations,
        mentionCandidates: [],
        completedAt: new Date(),
        providerCostUsd: 0,
        providerCostType: "estimated",
        rawPayload: {
          mock: true,
          label: "MOCK DATA",
          scanRunId: request.scanRunId,
          aiSurface: request.aiSurface,
        },
        metadata: { mock: true, label: "MOCK DATA" },
      },
      "mock",
    );
  }
}

/** @deprecated Prefer MockMonitoringProvider */
export const MockCitationMonitoringProvider = MockMonitoringProvider;

/** @deprecated Prefer MockMonitoringProvider */
export class MockCitationProvider extends MockMonitoringProvider {}
