import type {
  NormalizedScanRequest,
  ProviderPollResult,
  ProviderSubmissionResult,
} from "@/lib/monitoring/types";

export type {
  MonitoringProvider as CitationMonitoringProvider,
} from "@/lib/providers/provider";

/**
 * Provider-agnostic monitoring interface (Phase 5, extended Phase 8).
 * Application logic must not depend on DataForSEO payload shapes.
 */
export interface LegacyCitationMonitoringProvider {
  readonly name: "dataforseo" | "mock";
  submitScan(request: NormalizedScanRequest): Promise<ProviderSubmissionResult>;
  pollTask?(input: {
    providerTaskId: string;
    request: NormalizedScanRequest;
  }): Promise<ProviderPollResult>;
}

/** @deprecated Prefer CitationMonitoringProvider.submitScan */
export type CreateScanInput = {
  workspaceId: string;
  monitorConfigurationId: string;
  promptText: string;
  aiSurface: NormalizedScanRequest["aiSurface"];
  locale?: string;
  countryCode?: string;
  city?: string;
};

/** @deprecated Prefer ProviderSubmissionResult */
export type CreateScanResult = {
  provider: string;
  providerTaskId: string;
  estimatedCostUsd?: number;
  status: "queued" | "running";
};

/** @deprecated Prefer pollTask */
export type GetScanResultInput = {
  providerTaskId: string;
  workspaceId: string;
};

/** @deprecated Prefer NormalizedAiResult */
export type NormalizedSource = {
  url: string;
  title?: string;
  snippet?: string;
  position?: number;
};

/** @deprecated Prefer NormalizedAiResult + classification pipeline */
export type NormalizedScanResult = {
  provider: string;
  providerTaskId: string;
  status: "completed" | "partial" | "failed";
  promptTextSnapshot: string;
  responseText: string;
  modelName?: string;
  responseHash: string;
  sources: NormalizedSource[];
  classifications: unknown[];
  costUsd?: number;
  failureCode?: string;
  failureMessage?: string;
  metadata?: Record<string, unknown>;
};

export type EstimateCostInput = {
  aiSurface: NormalizedScanRequest["aiSurface"];
  countryCode?: string;
};

export type CostEstimate = {
  currency: "usd";
  estimatedCostUsd: number;
  notes?: string;
};
