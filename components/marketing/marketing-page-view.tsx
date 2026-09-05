"use client";

import { useEffect } from "react";

import {
  trackMarketingEvent,
  type MarketingEventName,
} from "@/lib/analytics/marketing";

type MarketingPageViewProps = {
  event: MarketingEventName;
  route: string;
};

export function MarketingPageView({ event, route }: MarketingPageViewProps) {
  useEffect(() => {
    trackMarketingEvent(event, { route });
  }, [event, route]);

  return null;
}
