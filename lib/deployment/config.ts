import "server-only";

/** Authoritative server-side deployment mode variable. */
export const DEPLOYMENT_MODE_ENV = "CITED_DEPLOYMENT_MODE" as const;

/**
 * Client-safe mirror for browser bundles. Set at build time from server mode.
 * Do not treat this as the authoritative runtime source on the server.
 */
export const PUBLIC_DEPLOYMENT_MODE_ENV =
  "NEXT_PUBLIC_CITED_DEPLOYMENT_MODE" as const;

/**
 * Read the raw deployment mode environment value.
 * This is the only module that may read process.env.CITED_DEPLOYMENT_MODE.
 */
export function readDeploymentModeEnv(): string | undefined {
  const raw = process.env[DEPLOYMENT_MODE_ENV];
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const trimmed = String(raw).trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Test-only override. Never use outside tests. */
let testModeOverride: string | undefined | null = null;

export function setDeploymentModeOverrideForTests(
  value: string | undefined | null,
): void {
  testModeOverride = value;
}

export function readDeploymentModeRawForResolution(): string | undefined {
  if (testModeOverride !== null) {
    return testModeOverride === undefined ? undefined : testModeOverride;
  }
  return readDeploymentModeEnv();
}
