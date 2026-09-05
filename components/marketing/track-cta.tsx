"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import {
  trackMarketingEvent,
  type MarketingEventPayload,
} from "@/lib/analytics/marketing";
import { cn } from "@/lib/utils";

type TrackCtaProps = {
  href: string;
  children: ReactNode;
  cta: string;
  event?:
    | "marketing_cta_clicked"
    | "marketing_pricing_plan_selected"
    | "marketing_sign_in_clicked"
    | "marketing_sign_up_clicked";
  payload?: Omit<MarketingEventPayload, "cta">;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  asLink?: boolean;
};

export function TrackCta({
  href,
  children,
  cta,
  event = "marketing_cta_clicked",
  payload,
  variant = "primary",
  size = "md",
  className,
  asLink = false,
}: TrackCtaProps) {
  function handleClick() {
    trackMarketingEvent(event, { cta, route: href, ...payload });
  }

  if (asLink) {
    return (
      <Link
        href={href}
        onClick={handleClick}
        className={cn(className)}
      >
        {children}
      </Link>
    );
  }

  return (
    <Button
      href={href}
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick as ComponentProps<typeof Button>["onClick"]}
    >
      {children}
    </Button>
  );
}
