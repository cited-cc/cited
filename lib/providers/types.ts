import type { AiSurfaceKey } from "@/types/product";

import type { ProviderErrorCode } from "@/lib/providers/errors";
import type {
  MonitoringProviderKind,
  NormalizedAiResult,
  NormalizedScanRequest,
  ProviderSubmissionResult,
} from "@/lib/monitoring/types";

export const MONITORING_PROVIDER_IDS = ["dataforseo", "mock"] as const;

export type MonitoringProviderId = (typeof MONITORING_PROVIDER_IDS)[number];

export const MONITORING_EXECUTION_STRATEGIES = [
  "live_sync",
  "live_async",
  "fixture_sync",
] as const;

export type MonitoringExecutionStrategy =
  (typeof MONITORING_EXECUTION_STRATEGIES)[number];

export type ProviderCapabilityStatus = "available" | "beta" | "planned";

export type MonitoringProviderMetadata = Readonly<{
  id: MonitoringProviderId;
  displayName: string;
  adapterVersion: string;
  normalizationVersion: string;
  supportedSurfaces: readonly AiSurfaceKey[];
  supportedExecutionStrategies: readonly MonitoringExecutionStrategy[];
  requiresPolling: boolean;
  suggestedPollIntervalSeconds: number;
  operationalNotes: readonly string[];
  capabilityStatus: ProviderCapabilityStatus;
}>;

export type ProviderConfigurationResult =
  | {
      ok: true;
      providerId: MonitoringProviderId;
      ready: boolean;
      warnings: readonly string[];
    }
  | {
      ok: false;
      providerId: MonitoringProviderId;
      code: ProviderErrorCode;
      safeMessage: string;
      warnings: readonly string[];
    };

export type ProviderPollRequest = Readonly<{
  providerTaskId: string;
  request: NormalizedScanRequest;
  deadline?: Date;
}>;

export type ProviderCancelRequest = Readonly<{
  providerTaskId: string;
  request: NormalizedScanRequest;
}>;

export type ProviderSubmission = ProviderSubmissionResult;

export type ProviderNormalizedScanRequest = NormalizedScanRequest;

export type ProviderNormalizedResult = NormalizedAiResult;

export type { MonitoringProviderKind };

export const NORMALIZATION_VERSION = "2026.09.04" as const;

export const PROVIDER_LIMITS = Object.freeze({
  maxPromptChars: 8_000,
  maxResponseTextChars: 200_000,
  maxCitationCount: 200,
  maxMentionCount: 500,
  maxMetadataKeys: 50,
  maxRawPayloadBytes: 524_288,
});
