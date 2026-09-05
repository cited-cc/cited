import type { MonitoringErrorCategory } from "@/lib/monitoring/types";
import {
  MonitoringError,
  mapHttpStatusToCategory,
  safeMessageForCategory,
} from "@/lib/monitoring/errors";

export type DataForSeoErrorCode =
  | "provider_timeout"
  | "provider_rate_limited"
  | "provider_unavailable"
  | "provider_invalid_response"
  | "provider_validation_error"
  | "unsupported_surface"
  | "credentials_missing";

export class DataForSeoError extends MonitoringError {
  readonly providerCode: DataForSeoErrorCode;

  constructor(input: {
    code: DataForSeoErrorCode;
    message: string;
    safeMessage?: string;
    retryable?: boolean;
    providerStatusCode?: number | null;
  }) {
    const category: MonitoringErrorCategory =
      input.code === "credentials_missing"
        ? "provider_validation_error"
        : input.code;
    super({
      category,
      message: input.message,
      safeMessage: input.safeMessage ?? safeMessageForCategory(category),
      retryable: input.retryable,
      providerStatusCode: input.providerStatusCode,
    });
    this.name = "DataForSeoError";
    this.providerCode = input.code;
  }
}

export function mapDataForSeoHttpStatus(
  status: number,
): DataForSeoErrorCode {
  const category = mapHttpStatusToCategory(status);
  switch (category) {
    case "provider_timeout":
    case "provider_rate_limited":
    case "provider_unavailable":
    case "provider_validation_error":
      return category;
    default:
      return "provider_unavailable";
  }
}

export function mapDataForSeoEnvelopeStatus(
  statusCode: number,
): DataForSeoErrorCode {
  if (statusCode === 40201 || statusCode === 40204) {
    return "provider_rate_limited";
  }
  if (statusCode >= 50000) return "provider_unavailable";
  if (statusCode !== 20000) return "provider_validation_error";
  return "provider_invalid_response";
}
