import "server-only";

import { getOptionalServerEnv } from "@/lib/env";
import {
  assertSurfaceExecutable,
  getAiSurfaceDefinition,
  isSerpSurfaceStrategy,
} from "@/lib/monitoring/surfaces";
import type {
  NormalizedScanRequest,
  ProviderPollResult,
  ProviderSubmissionResult,
} from "@/lib/monitoring/types";
import { logger } from "@/lib/security/logger";
import {
  DATAFORSEO_PROVIDER_METADATA,
} from "@/lib/providers/dataforseo/metadata";
import {
  DataForSeoError,
  mapDataForSeoHttpStatus,
} from "@/lib/providers/dataforseo/errors";
import { normalizeDataForSeoLiveResponse } from "@/lib/providers/dataforseo/normalize";
import { normalizeDataForSeoSerpResponse } from "@/lib/providers/dataforseo/normalize-serp";
import {
  DATAFORSEO_DEFAULT_TIMEOUT_MS,
  DATAFORSEO_MAX_PROMPT_CHARS,
} from "@/lib/providers/dataforseo/rate-limit";
import { getDataForSeoLiveEndpoint } from "@/lib/providers/dataforseo/surfaces";
import { buildDataForSeoSerpTask } from "@/lib/providers/dataforseo/serp-tasks";
import { buildDataForSeoLiveTask } from "@/lib/providers/dataforseo/tasks";
import type { DataForSeoClientOptions } from "@/lib/providers/dataforseo/types";
import type { MonitoringProvider } from "@/lib/providers/provider";
import type { ProviderConfigurationResult, ProviderPollRequest } from "@/lib/providers/types";
import { PROVIDER_LIMITS } from "@/lib/providers/types";
import { validateNormalizedAiResult } from "@/lib/providers/normalization";

const DATAFORSEO_ALLOWED_HOSTS = new Set([
  "api.dataforseo.com",
  "sandbox.dataforseo.com",
]);

const DATAFORSEO_ALLOWED_PATH_PREFIXES = [
  "/v3/ai_optimization/",
  "/v3/serp/google/",
] as const;

const MAX_RESPONSE_BYTES = PROVIDER_LIMITS.maxRawPayloadBytes;

function buildAuthHeader(login: string, password: string): string {
  const token = Buffer.from(`${login}:${password}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

function assertAllowedEndpoint(baseUrl: string, path: string): void {
  let host: string;
  try {
    host = new URL(baseUrl).hostname;
  } catch {
    throw new DataForSeoError({
      code: "provider_validation_error",
      message: "Invalid DataForSEO base URL.",
      safeMessage: "Monitoring provider is not configured.",
      retryable: false,
    });
  }

  const isProd = process.env.NODE_ENV === "production";
  if (isProd && !DATAFORSEO_ALLOWED_HOSTS.has(host)) {
    throw new DataForSeoError({
      code: "provider_validation_error",
      message: "Production DataForSEO base URL must use an official host.",
      retryable: false,
    });
  }

  if (
    !isProd &&
    !DATAFORSEO_ALLOWED_HOSTS.has(host) &&
    host !== "localhost" &&
    host !== "127.0.0.1"
  ) {
    throw new DataForSeoError({
      code: "provider_validation_error",
      message: "DataForSEO base URL must use an official host or localhost in development.",
      retryable: false,
    });
  }

  if (!DATAFORSEO_ALLOWED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    throw new DataForSeoError({
      code: "provider_validation_error",
      message: "DataForSEO endpoint path is not allowlisted.",
      retryable: false,
    });
  }
}

/**
 * Official DataForSEO adapter for LLM Responses and Google SERP AI surfaces.
 * Server-only. Never import from Client Components or demo/public routes.
 */
export class DataForSeoMonitoringProvider implements MonitoringProvider {
  readonly metadata = DATAFORSEO_PROVIDER_METADATA;
  readonly name = "dataforseo" as const;

  private readonly optionsOverride?: Partial<DataForSeoClientOptions>;
  private resolvedOptions: DataForSeoClientOptions | null = null;

  constructor(options?: Partial<DataForSeoClientOptions>) {
    this.optionsOverride = options;
  }

  validateConfiguration(): ProviderConfigurationResult {
    const env = getOptionalServerEnv();
    const login = this.optionsOverride?.login ?? env.DATAFORSEO_LOGIN;
    const password = this.optionsOverride?.password ?? env.DATAFORSEO_PASSWORD;

    if (!login || !password) {
      return {
        ok: false,
        providerId: "dataforseo",
        code: "configuration_error",
        safeMessage: "Monitoring provider credentials are not configured.",
        warnings: [],
      };
    }

    try {
      const options = this.resolveOptions(true);
      assertAllowedEndpoint(options.baseUrl, "/v3/ai_optimization/chat_gpt/llm_responses/live");
      return {
        ok: true,
        providerId: "dataforseo",
        ready: true,
        warnings: [
          "DataForSEO usage is billed to your provider account.",
          "Consumer-product answers may differ from direct model APIs.",
        ],
      };
    } catch (error) {
      if (error instanceof DataForSeoError) {
        return {
          ok: false,
          providerId: "dataforseo",
          code:
            error.providerCode === "credentials_missing"
              ? "configuration_error"
              : "authentication_failure",
          safeMessage: error.safeMessage,
          warnings: [],
        };
      }
      return {
        ok: false,
        providerId: "dataforseo",
        code: "configuration_error",
        safeMessage: "Monitoring provider is not configured.",
        warnings: [],
      };
    }
  }

  async submitScan(
    request: NormalizedScanRequest,
  ): Promise<ProviderSubmissionResult> {
    if (request.prompt.length > DATAFORSEO_MAX_PROMPT_CHARS) {
      return {
        status: "failed",
        retryable: false,
        code: "provider_validation_error",
        safeMessage: "This monitor prompt exceeds the provider size limit.",
      };
    }

    try {
      assertSurfaceExecutable(request.aiSurface);
      if (!this.metadata.supportedSurfaces.includes(request.aiSurface)) {
        return {
          status: "failed",
          retryable: false,
          code: "unsupported_surface",
          safeMessage: "This AI surface is not available for monitoring.",
        };
      }

      const endpoint = getDataForSeoLiveEndpoint(request.aiSurface);
      if (!endpoint) {
        return {
          status: "failed",
          retryable: false,
          code: "unsupported_surface",
          safeMessage: "This AI surface is not available for monitoring.",
        };
      }

      const options = this.resolveOptions(true);
      assertAllowedEndpoint(options.baseUrl, endpoint);

      const strategy = getAiSurfaceDefinition(request.aiSurface).requestStrategy;
      const body = isSerpSurfaceStrategy(strategy)
        ? buildDataForSeoSerpTask(request)
        : buildDataForSeoLiveTask(request);
      const envelope = await this.postJson(endpoint, body, request, options);
      const normalized = isSerpSurfaceStrategy(strategy)
        ? normalizeDataForSeoSerpResponse({ envelope, request })
        : normalizeDataForSeoLiveResponse({ envelope, request });

      return {
        status: "completed",
        result: validateNormalizedAiResult(normalized, "dataforseo"),
      };
    } catch (error) {
      if (error instanceof DataForSeoError) {
        return {
          status: "failed",
          retryable: error.retryable,
          code: error.category,
          safeMessage: error.safeMessage,
          providerStatusCode: error.providerStatusCode,
        };
      }
      if (error instanceof Error && error.name === "AbortError") {
        return {
          status: "failed",
          retryable: true,
          code: "provider_timeout",
          safeMessage:
            "The monitoring provider timed out. Cited will retry automatically.",
        };
      }
      logger.error("DataForSEO submit failed", {
        event: "monitoring.provider.submit_error",
        scanRunId: request.scanRunId,
        workspaceId: request.workspaceId,
        aiSurface: request.aiSurface,
        correlationId: request.correlationId,
        safeErrorCode: "provider_unavailable",
      });
      return {
        status: "failed",
        retryable: true,
        code: "provider_unavailable",
        safeMessage: "The monitoring provider is temporarily unavailable.",
      };
    }
  }

  async pollTask(input: ProviderPollRequest): Promise<ProviderPollResult> {
    void input;
    return {
      status: "failed",
      retryable: false,
      code: "provider_validation_error",
      safeMessage: "This provider path does not support polling.",
    };
  }

  private resolveOptions(requireCredentials: boolean): DataForSeoClientOptions {
    if (this.resolvedOptions) {
      return this.resolvedOptions;
    }

    const env = getOptionalServerEnv();
    const login = this.optionsOverride?.login ?? env.DATAFORSEO_LOGIN;
    const password = this.optionsOverride?.password ?? env.DATAFORSEO_PASSWORD;
    const baseUrl = (
      this.optionsOverride?.baseUrl ??
      env.DATAFORSEO_API_BASE_URL ??
      "https://api.dataforseo.com"
    ).replace(/\/$/, "");
    const timeoutMs =
      this.optionsOverride?.timeoutMs ??
      env.MONITORING_PROVIDER_TIMEOUT_MS ??
      DATAFORSEO_DEFAULT_TIMEOUT_MS;

    if (requireCredentials && (!login || !password)) {
      throw new DataForSeoError({
        code: "credentials_missing",
        message: "DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required.",
        safeMessage: "Monitoring provider is not configured.",
        retryable: false,
      });
    }

    this.resolvedOptions = {
      login: login ?? "",
      password: password ?? "",
      baseUrl,
      timeoutMs,
      fetchImpl: this.optionsOverride?.fetchImpl,
    };
    return this.resolvedOptions;
  }

  private async postJson(
    path: string,
    body: unknown,
    request: NormalizedScanRequest,
    options: DataForSeoClientOptions,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs);
    const fetchImpl = options.fetchImpl ?? fetch;

    try {
      const response = await fetchImpl(`${options.baseUrl}${path}`, {
        method: "POST",
        headers: {
          Authorization: buildAuthHeader(options.login, options.password),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (response.status === 429) {
        throw new DataForSeoError({
          code: "provider_rate_limited",
          message: "DataForSEO rate limited the request.",
          retryable: true,
          providerStatusCode: 429,
        });
      }

      if (response.status === 401 || response.status === 403) {
        throw new DataForSeoError({
          code: "provider_validation_error",
          message: `DataForSEO HTTP ${response.status}`,
          retryable: false,
          providerStatusCode: response.status,
          safeMessage: "The monitoring provider rejected the configured credentials.",
        });
      }

      if (response.status === 402) {
        throw new DataForSeoError({
          code: "provider_validation_error",
          message: "DataForSEO quota exhausted.",
          retryable: false,
          providerStatusCode: 402,
          safeMessage: "The monitoring provider account quota has been exhausted.",
        });
      }

      if (response.status >= 500) {
        throw new DataForSeoError({
          code: "provider_unavailable",
          message: `DataForSEO HTTP ${response.status}`,
          retryable: true,
          providerStatusCode: response.status,
        });
      }

      if (!response.ok) {
        throw new DataForSeoError({
          code: mapDataForSeoHttpStatus(response.status),
          message: `DataForSEO HTTP ${response.status}`,
          retryable: false,
          providerStatusCode: response.status,
        });
      }

      const rawText = await response.text();
      if (rawText.length > MAX_RESPONSE_BYTES) {
        throw new DataForSeoError({
          code: "provider_invalid_response",
          message: "DataForSEO response exceeded size limit.",
          retryable: false,
        });
      }

      let json: unknown;
      try {
        json = JSON.parse(rawText);
      } catch {
        throw new DataForSeoError({
          code: "provider_invalid_response",
          message: "DataForSEO returned malformed JSON.",
          retryable: false,
        });
      }

      logger.info("DataForSEO request completed", {
        event: "monitoring.provider.submitted",
        scanRunId: request.scanRunId,
        workspaceId: request.workspaceId,
        aiSurface: request.aiSurface,
        correlationId: request.correlationId,
        status: response.status,
        responseBytes: rawText.length,
      });
      return json;
    } finally {
      clearTimeout(timer);
    }
  }
}

/** @deprecated Prefer DataForSeoMonitoringProvider */
export const DataForSeoCitationMonitoringProvider = DataForSeoMonitoringProvider;
