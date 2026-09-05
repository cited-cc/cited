/**
 * Inbox analytics helpers. Re-exports product tracking with Inbox event names.
 * Never pass prompts, domains, URLs, event IDs, or workspace IDs.
 */

export {
  trackProductEvent,
  sanitizeProductEventPayload,
} from "@/lib/analytics/product";
