import type {
  DeploymentCapability,
  DeploymentCapabilitiesSnapshot,
  DeploymentCapabilityDefinition,
  DeploymentMode,
  DeploymentPublicCapability,
} from "@/lib/deployment/types";

function defineCapability(
  definition: DeploymentCapabilityDefinition,
): DeploymentCapabilityDefinition {
  return Object.freeze(definition);
}

const CAPABILITY_REGISTRY: DeploymentCapabilitiesSnapshot = Object.freeze({
  monitoring: defineCapability({
    id: "monitoring",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription: "Citation monitoring engine and provider scheduling.",
    clientVisible: true,
  }),
  citationClassification: defineCapability({
    id: "citationClassification",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription: "Citation classification and event typing.",
    clientVisible: true,
  }),
  evidenceLedger: defineCapability({
    id: "evidenceLedger",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription: "Evidence ledger, occurrence history, and snapshots.",
    clientVisible: true,
  }),
  inbox: defineCapability({
    id: "inbox",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription: "Inbox triage for citation events.",
    clientVisible: true,
  }),
  notebook: defineCapability({
    id: "notebook",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription: "Citation notebook workflows.",
    clientVisible: true,
  }),
  domainVerification: defineCapability({
    id: "domainVerification",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription: "DNS TXT domain verification for monitored domains.",
    clientVisible: true,
  }),
  basicExport: defineCapability({
    id: "basicExport",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription: "Workspace data export.",
    clientVisible: true,
  }),
  workspaceRoles: defineCapability({
    id: "workspaceRoles",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription: "Basic workspace roles and access control.",
    clientVisible: true,
  }),
  internalSchedulerEndpoints: defineCapability({
    id: "internalSchedulerEndpoints",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription:
      "Authenticated internal scheduler endpoints for monitoring and notifications.",
    clientVisible: false,
  }),
  selfHostedAuthentication: defineCapability({
    id: "selfHostedAuthentication",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription:
      "Self-hosted email and password authentication with canonical internal user IDs.",
    clientVisible: true,
  }),
  selfHostedBootstrap: defineCapability({
    id: "selfHostedBootstrap",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription: "Self-hosted first-run bootstrap for the initial workspace owner.",
    clientVisible: true,
  }),
  selfHostedEntitlements: defineCapability({
    id: "selfHostedEntitlements",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription: "Self-hosted entitlements without commercial billing.",
    clientVisible: true,
  }),
  selfHostedScheduler: defineCapability({
    id: "selfHostedScheduler",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription:
      "Portable self-hosted background job worker and one-shot CLI.",
    clientVisible: true,
  }),
  selfHostedDocker: defineCapability({
    id: "selfHostedDocker",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription:
      "Production-grade Docker Compose deployment with secure local secret initialization.",
    clientVisible: true,
  }),
  selfHostedNotifications: defineCapability({
    id: "selfHostedNotifications",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription:
      "Self-hosted notification delivery with SMTP email and Slack webhooks.",
    clientVisible: true,
  }),
  portableDatabase: defineCapability({
    id: "portableDatabase",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription: "Portable PostgreSQL provider for self-hosted installs.",
    clientVisible: true,
  }),
  monitoringProviderRegistry: defineCapability({
    id: "monitoringProviderRegistry",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription:
      "Typed monitoring provider registry with server-controlled routing.",
    clientVisible: true,
  }),
  dataForSeoAdapter: defineCapability({
    id: "dataForSeoAdapter",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription:
      "Bring-your-own DataForSEO adapter for supported AI surfaces.",
    clientVisible: true,
  }),
  mockMonitoringProvider: defineCapability({
    id: "mockMonitoringProvider",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription:
      "Deterministic mock monitoring provider for demos and tests.",
    clientVisible: true,
  }),
  providerRouting: defineCapability({
    id: "providerRouting",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription:
      "Centralized monitoring provider selection and optional per-surface routing.",
    clientVisible: false,
  }),
  providerConfigurationValidation: defineCapability({
    id: "providerConfigurationValidation",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription:
      "Offline provider configuration validation without live provider calls.",
    clientVisible: false,
  }),
  fullMonitoringLifecycle: defineCapability({
    id: "fullMonitoringLifecycle",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription:
      "Complete monitoring lifecycle validation including competitor wiring.",
    clientVisible: false,
  }),
  deterministicMigrations: defineCapability({
    id: "deterministicMigrations",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription:
      "Checksum-protected SQL migrations with advisory locking.",
    clientVisible: false,
  }),
  databaseHealthChecks: defineCapability({
    id: "databaseHealthChecks",
    modes: ["self_hosted"],
    readiness: "available",
    publicDescription: "Safe database readiness checks without credential leakage.",
    clientVisible: false,
  }),
});

export function getDeploymentCapabilities(): DeploymentCapabilitiesSnapshot {
  return CAPABILITY_REGISTRY;
}

export function getCapabilityDefinition(
  capability: DeploymentCapability,
): DeploymentCapabilityDefinition {
  return CAPABILITY_REGISTRY[capability];
}

export function getCapabilityModes(
  capability: DeploymentCapability,
): readonly DeploymentMode[] {
  return CAPABILITY_REGISTRY[capability].modes;
}

export function hasDeploymentCapability(
  mode: DeploymentMode,
  capability: DeploymentCapability,
): boolean {
  const definition = CAPABILITY_REGISTRY[capability];
  if (!definition.modes.includes(mode)) {
    return false;
  }
  return definition.readiness === "available";
}

export function isCapabilityAvailable(
  capability: DeploymentCapability,
  mode: DeploymentMode,
): boolean {
  return hasDeploymentCapability(mode, capability);
}

export function listDeploymentCapabilities(
  mode: DeploymentMode,
): DeploymentCapability[] {
  return (Object.keys(CAPABILITY_REGISTRY) as DeploymentCapability[]).filter(
    (capability) => hasDeploymentCapability(mode, capability),
  );
}

export function listUnavailableCapabilities(
  mode: DeploymentMode,
): DeploymentCapability[] {
  return (Object.keys(CAPABILITY_REGISTRY) as DeploymentCapability[]).filter(
    (capability) => !hasDeploymentCapability(mode, capability),
  );
}

export function toPublicCapabilities(
  mode: DeploymentMode,
): readonly DeploymentPublicCapability[] {
  return Object.freeze(
    (Object.values(CAPABILITY_REGISTRY) as DeploymentCapabilityDefinition[])
      .filter((definition) => definition.clientVisible)
      .map((definition) =>
        Object.freeze({
          id: definition.id,
          enabled: hasDeploymentCapability(mode, definition.id),
          readiness: definition.readiness,
          description: definition.publicDescription,
        }),
      ),
  );
}

export function assertCapabilityRegistryComplete(
  expected: readonly DeploymentCapability[],
): void {
  const registered = Object.keys(CAPABILITY_REGISTRY) as DeploymentCapability[];
  for (const capability of expected) {
    if (!registered.includes(capability)) {
      throw new Error(`Missing capability registry entry: ${capability}`);
    }
  }
}

export const ALL_DEPLOYMENT_CAPABILITIES = Object.freeze(
  Object.keys(CAPABILITY_REGISTRY) as DeploymentCapability[],
);
