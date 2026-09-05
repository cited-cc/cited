import type { MonitoringErrorCategory } from "@/lib/monitoring/types";

export class MonitoringError extends Error {
  readonly category: MonitoringErrorCategory;
  readonly retryable: boolean;
  readonly providerStatusCode?: number | null;
  readonly safeMessage: string;

  constructor(input: {
    category: MonitoringErrorCategory;
    message: string;
    safeMessage?: string;
    retryable?: boolean;
    providerStatusCode?: number | null;
  }) {
    super(input.message);
    this.name = "MonitoringError";
    this.category = input.category;
    this.retryable = input.retryable ?? isRetryableCategory(input.category);
    this.providerStatusCode = input.providerStatusCode ?? null;
    this.safeMessage =
      input.safeMessage ?? safeMessageForCategory(input.category);
  }
}

export function isRetryableCategory(category: MonitoringErrorCategory): boolean {
  switch (category) {
    case "provider_timeout":
    case "provider_rate_limited":
    case "provider_unavailable":
    case "internal_persistence_error":
      return true;
    case "provider_invalid_response":
    case "provider_validation_error":
    case "unsupported_surface":
    case "monitor_not_eligible":
    case "billing_inactive":
    case "domain_unverified":
    case "usage_limit_reached":
    case "schedule_conflict":
    case "duplicate_run":
    case "monitoring_disabled":
    case "max_poll_attempts":
    case "max_attempts_exceeded":
      return false;
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}

export function safeMessageForCategory(
  category: MonitoringErrorCategory,
): string {
  switch (category) {
    case "provider_timeout":
      return "The monitoring provider timed out. Cited will retry automatically.";
    case "provider_rate_limited":
      return "The monitoring provider is rate limiting requests. Cited will retry shortly.";
    case "provider_unavailable":
      return "The monitoring provider is temporarily unavailable.";
    case "provider_invalid_response":
      return "The monitoring provider returned an unusable response.";
    case "provider_validation_error":
      return "This monitor configuration was rejected by the provider.";
    case "unsupported_surface":
      return "This AI surface is not available for monitoring.";
    case "monitor_not_eligible":
      return "This monitor is not eligible to run.";
    case "billing_inactive":
      return "Monitoring is paused because billing is inactive.";
    case "domain_unverified":
      return "Monitoring requires a verified domain.";
    case "usage_limit_reached":
      return "Monitoring is paused because the usage safety limit was reached.";
    case "schedule_conflict":
      return "A scan is already scheduled for this slot.";
    case "duplicate_run":
      return "This scan was already recorded.";
    case "internal_persistence_error":
      return "Cited could not save monitoring results. The team has been notified via logs.";
    case "monitoring_disabled":
      return "Monitoring is currently disabled for this environment.";
    case "max_poll_attempts":
      return "Cited stopped waiting for a provider result after too many polls.";
    case "max_attempts_exceeded":
      return "Cited stopped retrying this scan after repeated failures.";
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}

export function mapHttpStatusToCategory(
  status: number,
): MonitoringErrorCategory {
  if (status === 429) return "provider_rate_limited";
  if (status === 408 || status === 504) return "provider_timeout";
  if (status >= 500) return "provider_unavailable";
  if (status >= 400) return "provider_validation_error";
  return "provider_unavailable";
}
