/**
 * Feature flags for community edition (self-hosted only).
 */

function parseBooleanFlag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

/** Cloud marketing free scan is unavailable in community edition. */
export function isFreeScanEnabled(): boolean {
  return false;
}

/** Client-safe mirror. */
export function isFreeScanEnabledPublic(): boolean {
  return false;
}

/** Hosted analytics is unavailable in community edition. */
export function isHostedAnalyticsEnabled(): boolean {
  return false;
}

/** Stripe billing is unavailable in community edition. */
export function isStripeBillingEnabled(): boolean {
  return false;
}

/** Product Hunt launch mode (client-safe). */
export function isLaunchModeEnabled(): boolean {
  return parseBooleanFlag(process.env.NEXT_PUBLIC_LAUNCH_MODE, false);
}

/** Whether Founder launch offer messaging may be shown. */
export function isLaunchOfferEnabled(): boolean {
  return parseBooleanFlag(process.env.NEXT_PUBLIC_LAUNCH_OFFER_ENABLED, false);
}

/** Learn Domains handoff is unavailable in community edition. */
export function isLearnDomainsEnabled(): boolean {
  return false;
}

/** Cited marketing chatbot is unavailable in community edition. */
export function isCitedChatbotEnabled(): boolean {
  return false;
}
