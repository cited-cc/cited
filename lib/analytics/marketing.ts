/**
 * Privacy-conscious marketing analytics stubs for self-hosted community edition.
 */

export const MARKETING_EVENTS = [
  "marketing_home_viewed",
  "marketing_demo_viewed",
  "marketing_pricing_viewed",
  "marketing_how_it_works_viewed",
  "marketing_docs_viewed",
  "marketing_blog_viewed",
  "marketing_cta_clicked",
  "marketing_pricing_plan_selected",
  "marketing_sign_in_clicked",
  "marketing_sign_up_clicked",
] as const;

export type MarketingEventName = (typeof MARKETING_EVENTS)[number];

export type MarketingEventPayload = {
  route?: string;
  cta?: string;
  plan?: string;
  step?: string;
};

export function trackMarketingEvent(
  _event: MarketingEventName,
  _payload?: MarketingEventPayload,
): void {
  // No-op in community edition.
}
