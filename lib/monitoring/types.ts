import type { AiSurfaceKey, CitationEventType } from "@/types/product";

export type MonitorActivationStatus =
  | "configured"
  | "active"
  | "paused"
  | "blocked"
  | "disabled";

export type ScanRunType = "baseline" | "recurring" | "manual";

export type ProviderCostType = "actual" | "estimated" | "unknown";

export type MonitoringProviderKind = "dataforseo" | "mock";

export type MonitoringErrorCategory =
  | "provider_timeout"
  | "provider_rate_limited"
  | "provider_unavailable"
  | "provider_invalid_response"
  | "provider_validation_error"
  | "unsupported_surface"
  | "monitor_not_eligible"
  | "billing_inactive"
  | "domain_unverified"
  | "usage_limit_reached"
  | "schedule_conflict"
  | "duplicate_run"
  | "internal_persistence_error"
  | "monitoring_disabled"
  | "max_poll_attempts"
  | "max_attempts_exceeded";

export type NormalizedScanRequest = {
  scanRunId: string;
  workspaceId: string;
  domainId: string;
  monitoredPromptId: string;
  monitorConfigurationId: string;
  prompt: string;
  aiSurface: AiSurfaceKey;
  languageCode: string;
  countryCode: string;
  city?: string | null;
  scheduledFor: Date;
  runType: ScanRunType;
  correlationId: string;
};

export type NormalizedCitationSource = {
  url?: string | null;
  normalizedUrl?: string | null;
  hostname?: string | null;
  title?: string | null;
  snippet?: string | null;
  position?: number | null;
  providerReferenceId?: string | null;
  metadata?: Record<string, unknown>;
};

export type NormalizedMentionCandidate = {
  text: string;
  startIndex?: number | null;
  endIndex?: number | null;
  matchedBrandName?: string | null;
  confidenceScore: number;
  metadata?: Record<string, unknown>;
};

export type NormalizedAiResult = {
  provider: MonitoringProviderKind;
  providerTaskId?: string | null;
  providerRequestId?: string | null;
  aiSurface: AiSurfaceKey;
  modelName?: string | null;
  prompt: string;
  responseText: string;
  responseLanguage?: string | null;
  location: {
    languageCode: string;
    countryCode: string;
    city?: string | null;
  };
  citations: NormalizedCitationSource[];
  mentionCandidates: NormalizedMentionCandidate[];
  completedAt: Date;
  providerCostUsd?: number | null;
  providerCostType: ProviderCostType;
  rawPayload: unknown;
  metadata?: Record<string, unknown>;
};

export type ProviderSubmissionResult =
  | {
      status: "completed";
      result: NormalizedAiResult;
    }
  | {
      status: "pending";
      providerTaskId: string;
      pollAfterSeconds: number;
      providerMetadata?: Record<string, unknown>;
    }
  | {
      status: "failed";
      retryable: boolean;
      code: MonitoringErrorCategory | string;
      safeMessage: string;
      providerStatusCode?: number | null;
      providerMetadata?: Record<string, unknown>;
    };

export type ProviderPollResult =
  | {
      status: "completed";
      result: NormalizedAiResult;
    }
  | {
      status: "pending";
      pollAfterSeconds: number;
      providerMetadata?: Record<string, unknown>;
    }
  | {
      status: "failed";
      retryable: boolean;
      code: MonitoringErrorCategory | string;
      safeMessage: string;
      providerStatusCode?: number | null;
      providerMetadata?: Record<string, unknown>;
    };

export type ClassifiedCitationEvent = {
  eventType: CitationEventType;
  confidenceScore: number;
  fingerprintKey: string;
  matchedDomainId?: string | null;
  matchedBrandId?: string | null;
  citedUrl?: string | null;
  citedUrlNormalized?: string | null;
  citedHostname?: string | null;
  sourceTitle?: string | null;
  sourceSnippet?: string | null;
  citationPosition?: number | null;
  evidence: Array<{
    evidenceType:
      | "source_link"
      | "response_excerpt"
      | "brand_match"
      | "domain_match"
      | "recommendation_excerpt"
      | "competitor_match";
    evidenceText?: string | null;
    evidenceUrl?: string | null;
    evidencePosition?: number | null;
    metadata?: Record<string, unknown>;
  }>;
  metadata?: Record<string, unknown>;
};

export type MonitoringSafetyLimits = {
  maxActiveMonitorConfigurations: number;
  maxMonthlyMonitorChecks: number;
  maxBaselineChecksPerActivation: number;
  maxProviderCostUsdPerBillingPeriod?: number;
  maxConcurrentRunsPerWorkspace: number;
  maxConsecutiveFailuresBeforeBlock: number;
};

export type DispatcherSummary = {
  monitorsEvaluated: number;
  runsCreated: number;
  runsClaimed: number;
  runsCompleted: number;
  runsPending: number;
  runsFailed: number;
  runsSkipped: number;
  leasesReleased: number;
  processingRounds: number;
};

export type MonitoringHealthSnapshot = {
  monitoringEnabled: boolean;
  providerConfigured: boolean;
  provider: MonitoringProviderKind | "none";
  queuedRunCount: number;
  runningRunCount: number;
  failedRunCountRecent: number;
  oldestPendingRunAgeSeconds: number | null;
};
