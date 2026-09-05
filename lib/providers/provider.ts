import type {
  MonitoringProviderMetadata,
  ProviderCancelRequest,
  ProviderConfigurationResult,
  ProviderNormalizedScanRequest,
  ProviderPollRequest,
  ProviderSubmission,
} from "@/lib/providers/types";
import type { ProviderPollResult } from "@/lib/monitoring/types";

/**
 * Canonical monitoring provider contract (Phase 8).
 * Core monitoring must depend on this interface, not provider-specific payloads.
 */
export interface MonitoringProvider {
  readonly metadata: MonitoringProviderMetadata;

  validateConfiguration(): ProviderConfigurationResult;

  submitScan(request: ProviderNormalizedScanRequest): Promise<ProviderSubmission>;

  pollTask?(request: ProviderPollRequest): Promise<ProviderPollResult>;

  cancelTask?(request: ProviderCancelRequest): Promise<void>;
}

/** @deprecated Prefer MonitoringProvider */
export type CitationMonitoringProvider = MonitoringProvider & {
  readonly name: MonitoringProviderMetadata["id"];
};
