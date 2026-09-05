import "@/lib/providers/bootstrap";

export type {
  MonitoringProviderId,
  MonitoringProviderMetadata,
  MonitoringExecutionStrategy,
  ProviderCapabilityStatus,
  ProviderConfigurationResult,
  ProviderPollRequest,
  ProviderCancelRequest,
  ProviderSubmission,
  ProviderNormalizedScanRequest,
  ProviderNormalizedResult,
  MonitoringProviderKind,
} from "@/lib/providers/types";

export {
  MONITORING_PROVIDER_IDS,
  MONITORING_EXECUTION_STRATEGIES,
  NORMALIZATION_VERSION,
  PROVIDER_LIMITS,
} from "@/lib/providers/types";

export type { MonitoringProvider, CitationMonitoringProvider } from "@/lib/providers/provider";

export {
  ProviderError,
  PROVIDER_ERROR_CODES,
  mapMonitoringCategoryToProviderCode,
  mapProviderCodeToMonitoringCategory,
} from "@/lib/providers/errors";
export type { ProviderErrorCode } from "@/lib/providers/errors";

export {
  resolveDefaultMonitoringProviderId,
  parseSurfaceProviderMap,
  isMockProviderAllowed,
  assertMonitoringProviderSelection,
  CANONICAL_PROVIDER_ENV,
  LEGACY_PROVIDER_ENV,
  SURFACE_MAP_ENV,
  ALLOW_MOCK_ENV,
} from "@/lib/providers/config";

export {
  registerMonitoringProvider,
  finalizeMonitoringProviderRegistry,
  listMonitoringProviders,
  getProviderMetadata,
  getMonitoringProvider,
  resolveProviderForSurface,
  assertProviderSupportsSurface,
  getMonitoringProviderForSurface,
  resetMonitoringProviderRegistryForTests,
} from "@/lib/providers/registry";

export {
  resolveMonitoringProviderIdForSurface,
  validateProviderRouting,
} from "@/lib/providers/router";

export {
  enforceTextLimit,
  validateNormalizedAiResult,
  validateNormalizedCitationSource,
} from "@/lib/providers/normalization";

export {
  getProviderStatusView,
  getPublicProviderHealthPayload,
} from "@/lib/providers/status";

export {
  MockMonitoringProvider,
  MockCitationMonitoringProvider,
  MOCK_PROVIDER_METADATA,
} from "@/lib/providers/mock";

export {
  DATAFORSEO_PROVIDER_METADATA,
  DATAFORSEO_ADAPTER_VERSION,
} from "@/lib/providers/dataforseo/metadata";

export {
  ensureMonitoringProviderRegistry,
  resetMonitoringProviderBootstrapForTests,
} from "@/lib/providers/bootstrap";
