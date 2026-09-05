/**
 * Privacy-conscious product analytics stubs for self-hosted community edition.
 */

export const PRODUCT_EVENTS = [
  "auth_sign_in_viewed",
  "auth_sign_up_viewed",
  "onboarding_step_viewed",
  "monitor_created",
  "domain_verified",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENTS)[number];

export type ProductEventPayload = Record<string, string | number | boolean | undefined>;

const FORBIDDEN_KEYS = new Set([
  "email",
  "domain",
  "hostname",
  "prompt",
  "prompts",
  "brand",
  "token",
  "url",
  "name",
  "phone",
  "message",
  "text",
  "body",
]);

export function sanitizeProductEventPayload(
  payload?: ProductEventPayload,
): Record<string, string | number | boolean> | undefined {
  if (!payload) return undefined;
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) continue;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      if (
        typeof value === "string" &&
        (/@/.test(value) ||
          value.startsWith("cus_") ||
          value.startsWith("sub_") ||
          value.startsWith("cs_") ||
          value.startsWith("evt_") ||
          /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(value))
      ) {
        continue;
      }
      clean[key] = value;
    }
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
}

export function trackProductEvent(
  _event: ProductEventName | string,
  _payload?: ProductEventPayload,
): void {
  // No-op in community edition.
}
