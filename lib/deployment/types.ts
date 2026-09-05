/**
 * Product deployment mode. Distinct from NODE_ENV runtime environment.
 */
export type DeploymentMode = "cloud" | "self_hosted";

export const DEPLOYMENT_MODES = [
  "cloud",
  "self_hosted",
] as const satisfies readonly DeploymentMode[];

/** NODE_ENV values used for runtime behavior (build, test, dev server). */
export type RuntimeEnvironment = "development" | "test" | "production";

/** Readiness for capabilities that depend on future open-source phases. */
export type CapabilityReadiness = "available" | "planned" | "not_implemented";

/**
 * Named product capabilities gated by deployment mode.
 * Prefer checking capabilities over scattering mode comparisons.
 */
export type DeploymentCapability =
  | "monitoring"
  | "citationClassification"
  | "evidenceLedger"
  | "inbox"
  | "notebook"
  | "domainVerification"
  | "basicExport"
  | "workspaceRoles"
  | "internalSchedulerEndpoints"
  | "selfHostedAuthentication"
  | "selfHostedBootstrap"
  | "selfHostedEntitlements"
  | "selfHostedScheduler"
  | "selfHostedDocker"
  | "selfHostedNotifications"
  | "portableDatabase"
  | "monitoringProviderRegistry"
  | "dataForSeoAdapter"
  | "mockMonitoringProvider"
  | "providerRouting"
  | "providerConfigurationValidation"
  | "fullMonitoringLifecycle"
  | "deterministicMigrations"
  | "databaseHealthChecks";

export type DeploymentCapabilityDefinition = Readonly<{
  id: DeploymentCapability;
  modes: readonly DeploymentMode[];
  readiness: CapabilityReadiness;
  publicDescription: string;
  clientVisible: boolean;
  /** Internal note for maintainers. Never sent to clients. */
  implementationNote?: string;
}>;

export type DeploymentCapabilitiesSnapshot = Readonly<
  Record<DeploymentCapability, Readonly<DeploymentCapabilityDefinition>>
>;

export type DeploymentPublicCapability = Readonly<{
  id: DeploymentCapability;
  enabled: boolean;
  readiness: CapabilityReadiness;
  description: string;
}>;

export type DeploymentPublicConfig = Readonly<{
  mode: DeploymentMode;
  isCloud: boolean;
  isSelfHosted: boolean;
  capabilities: readonly DeploymentPublicCapability[];
}>;

export type DeploymentStatusPayload = Readonly<{
  mode: DeploymentMode;
  version: string;
  coreReady: boolean;
  enabledCapabilities: readonly DeploymentCapability[];
  disabledCapabilities: readonly DeploymentCapability[];
  configurationReady: boolean;
}>;

export type DeploymentCapabilityErrorCode =
  | "capability_unavailable"
  | "deployment_mode_mismatch";

export type DeploymentConfigurationErrorCode =
  | "deployment_mode_missing"
  | "deployment_mode_invalid";
