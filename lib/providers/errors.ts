import type { MonitoringProviderId } from "@/lib/providers/types";

export const PROVIDER_ERROR_CODES = [
  "configuration_error",
  "authentication_failure",
  "unsupported_surface",
  "invalid_request",
  "rate_limited",
  "quota_exhausted",
  "temporary_provider_failure",
  "permanent_provider_failure",
  "timeout",
  "polling_deadline_exceeded",
  "invalid_provider_response",
  "provider_unavailable",
  "canceled_task",
] as const;

export type ProviderErrorCode = (typeof PROVIDER_ERROR_CODES)[number];

const RETRYABLE_CODES = new Set<ProviderErrorCode>([
  "rate_limited",
  "temporary_provider_failure",
  "timeout",
  "provider_unavailable",
]);

const SAFE_MESSAGES: Record<ProviderErrorCode, string> = {
  configuration_error:
    "The monitoring provider is not configured correctly for this environment.",
  authentication_failure:
    "The monitoring provider rejected the configured credentials.",
  unsupported_surface:
    "This AI surface is not supported by the selected monitoring provider.",
  invalid_request:
    "The monitoring provider rejected this scan request.",
  rate_limited:
    "The monitoring provider is rate limiting requests. Cited will retry shortly.",
  quota_exhausted:
    "The monitoring provider account quota has been exhausted.",
  temporary_provider_failure:
    "The monitoring provider is temporarily unavailable.",
  permanent_provider_failure:
    "The monitoring provider reported a permanent failure for this scan.",
  timeout:
    "The monitoring provider timed out. Cited will retry automatically.",
  polling_deadline_exceeded:
    "Cited stopped waiting for a provider result after the polling deadline.",
  invalid_provider_response:
    "The monitoring provider returned an unusable response.",
  provider_unavailable:
    "The monitoring provider is temporarily unavailable.",
  canceled_task: "The provider task was canceled.",
};

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly retryable: boolean;
  readonly safeMessage: string;
  readonly providerId: MonitoringProviderId;
  readonly retryAfterSeconds?: number;
  readonly diagnosticId?: string;
  readonly providerStatusCode?: number | null;

  constructor(input: {
    code: ProviderErrorCode;
    message: string;
    providerId: MonitoringProviderId;
    safeMessage?: string;
    retryable?: boolean;
    retryAfterSeconds?: number;
    diagnosticId?: string;
    providerStatusCode?: number | null;
  }) {
    super(input.message);
    this.name = "ProviderError";
    this.code = input.code;
    this.providerId = input.providerId;
    this.retryable = input.retryable ?? RETRYABLE_CODES.has(input.code);
    this.safeMessage = input.safeMessage ?? SAFE_MESSAGES[input.code];
    this.retryAfterSeconds = input.retryAfterSeconds;
    this.diagnosticId = input.diagnosticId;
    this.providerStatusCode = input.providerStatusCode ?? null;
  }
}

export function mapMonitoringCategoryToProviderCode(
  category: string,
): ProviderErrorCode {
  switch (category) {
    case "provider_timeout":
      return "timeout";
    case "provider_rate_limited":
      return "rate_limited";
    case "provider_unavailable":
      return "provider_unavailable";
    case "provider_invalid_response":
      return "invalid_provider_response";
    case "provider_validation_error":
      return "invalid_request";
    case "unsupported_surface":
      return "unsupported_surface";
    case "max_poll_attempts":
      return "polling_deadline_exceeded";
    default:
      return "permanent_provider_failure";
  }
}

export function mapProviderCodeToMonitoringCategory(
  code: ProviderErrorCode,
): string {
  switch (code) {
    case "timeout":
      return "provider_timeout";
    case "rate_limited":
      return "provider_rate_limited";
    case "provider_unavailable":
    case "temporary_provider_failure":
      return "provider_unavailable";
    case "invalid_provider_response":
      return "provider_invalid_response";
    case "invalid_request":
    case "configuration_error":
    case "authentication_failure":
      return "provider_validation_error";
    case "unsupported_surface":
      return "unsupported_surface";
    case "polling_deadline_exceeded":
      return "max_poll_attempts";
    case "quota_exhausted":
    case "permanent_provider_failure":
    case "canceled_task":
      return "provider_unavailable";
    default: {
      const _exhaustive: never = code;
      return _exhaustive;
    }
  }
}
