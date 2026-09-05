import type { CitationMonitoringProvider } from "@/lib/monitoring/provider";
import type {
  NormalizedScanRequest,
  ProviderPollResult,
} from "@/lib/monitoring/types";

/**
 * Poll an asynchronous provider task through the provider adapter.
 * Live DataForSEO endpoints complete synchronously; mock may return pending.
 */
export async function pollProviderTask(input: {
  provider: CitationMonitoringProvider;
  providerTaskId: string;
  request: NormalizedScanRequest;
}): Promise<ProviderPollResult> {
  if (!input.provider.pollTask) {
    return {
      status: "failed",
      retryable: false,
      code: "provider_validation_error",
      safeMessage: "This provider path does not support polling.",
    };
  }
  return input.provider.pollTask({
    providerTaskId: input.providerTaskId,
    request: input.request,
  });
}
