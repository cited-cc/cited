export type {
  CapabilityReadiness,
  DeploymentCapability,
  DeploymentCapabilityDefinition,
  DeploymentCapabilitiesSnapshot,
  DeploymentCapabilityErrorCode,
  DeploymentConfigurationErrorCode,
  DeploymentMode,
  DeploymentPublicCapability,
  DeploymentPublicConfig,
  DeploymentStatusPayload,
  RuntimeEnvironment,
} from "@/lib/deployment/types";
export { DEPLOYMENT_MODES } from "@/lib/deployment/types";

export {
  DEPLOYMENT_MODE_ENV,
  readDeploymentModeEnv,
  setDeploymentModeOverrideForTests,
} from "@/lib/deployment/config";

export { PUBLIC_DEPLOYMENT_MODE_ENV } from "@/lib/deployment/public-config";

export {
  DeploymentCapabilityError,
  DeploymentConfigurationError,
} from "@/lib/deployment/errors";

export {
  getDeploymentMode,
  getRuntimeEnvironment,
  isCloudDeployment,
  isRuntimeProduction,
  isSelfHostedDeployment,
  parseDeploymentMode,
  resetDeploymentCacheForTests,
} from "@/lib/deployment/mode";

export {
  ALL_DEPLOYMENT_CAPABILITIES,
  getCapabilityDefinition,
  getCapabilityModes,
  getDeploymentCapabilities,
  hasDeploymentCapability,
  isCapabilityAvailable,
  listDeploymentCapabilities,
  listUnavailableCapabilities,
  toPublicCapabilities,
} from "@/lib/deployment/capabilities";

export {
  DeploymentGuardError,
  assertCloudCapability,
  isCloudCapabilityEnabled,
  requireCapability,
  requireCloudDeployment,
  requireDeploymentCapability,
  requireDeploymentMode,
  requireSelfHostedDeployment,
  whenCloud,
  whenSelfHosted,
  withCapability,
} from "@/lib/deployment/guards";

export {
  deploymentDisabledRouteResponse,
  guardBillingReconciliationRoute,
  guardCloudBillingRoute,
  guardDeploymentCapabilityRoute,
  guardHostedInboundEmailRoute,
  guardHostedLifecycleCampaignsRoute,
  guardLearnDomainsHandoffRoute,
  guardMarketingChatbotRoute,
  guardMarketingFreeScanRoute,
  guardStripeCheckoutRoute,
  guardStripePortalRoute,
  guardStripeWebhookRoute,
} from "@/lib/deployment/http-guards";

export {
  getPublicDeploymentConfig,
  getPublicDeploymentMode,
  serializePublicDeploymentConfig,
} from "@/lib/deployment/public-config";

export {
  getAuthenticatedDeploymentStatusView,
  getDeploymentStatusPayload,
  getPublicDeploymentStatusForHealth,
} from "@/lib/deployment/status";
