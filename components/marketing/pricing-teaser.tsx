import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { TrackCta } from "@/components/marketing/track-cta";
import { Badge } from "@/components/ui/badge";
import {
  FOUNDER_LIMIT_NOTE,
  PUBLIC_PLANS,
  TEASER_PLAN_KEYS,
} from "@/lib/content/plans";
import { PRICING_TEASER } from "@/lib/content/marketing";
import { getPlanCtaHref } from "@/lib/marketing/cta";
import { cn } from "@/lib/utils";

type PricingTeaserProps = {
  className?: string;
  authenticated?: boolean;
};

export function PricingTeaser({
  className,
  authenticated = false,
}: PricingTeaserProps) {
  return (
    <div className={cn(className)}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TEASER_PLAN_KEYS.map((key, index) => {
          const plan = PUBLIC_PLANS[key];
          const delay = (Math.min(index + 1, 5) as 1 | 2 | 3 | 4 | 5);
          return (
            <ScrollReveal key={plan.key} delay={delay} className="h-full">
              <div
                className={cn(
                  "cited-paper-texture motion-rise group relative flex h-full flex-col rounded-md border border-l-[3px] bg-cited-surface p-6 cited-note-shadow",
                  "transition-[border-color,box-shadow,transform] duration-200 ease-[var(--cited-ease)]",
                  plan.highlighted
                    ? "border-cited-citation/40 border-l-cited-citation"
                    : "border-cited-line border-l-cited-line-strong hover:border-cited-line-strong",
                )}
              >
                {plan.highlighted ? (
                  <span
                    className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cited-citation to-transparent opacity-80"
                    aria-hidden
                  />
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="type-micro text-cited-citation">
                      [ {plan.name.toUpperCase()} ]
                    </p>
                    <h3 className="mt-2 type-title text-cited-ink-strong">
                      {plan.name}
                    </h3>
                  </div>
                  {plan.badge ? (
                    <Badge variant="success">{plan.badge}</Badge>
                  ) : null}
                </div>
                <p className="mt-3 font-mono text-2xl tracking-tight text-cited-ink-strong">
                  {plan.priceLabel}
                </p>
                <p className="mt-2 type-body-sm text-cited-ink-muted">
                  {plan.tagline}
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.teaserFeatures.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 type-body-sm text-cited-ink-muted"
                    >
                      <span
                        className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cited-citation/80"
                        aria-hidden
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <TrackCta
                    href={getPlanCtaHref({ plan: plan.key, authenticated })}
                    cta={`teaser_${plan.key}`}
                    event="marketing_pricing_plan_selected"
                    payload={{ plan: plan.key }}
                    variant={plan.highlighted ? "primary" : "secondary"}
                    size="md"
                    className="w-full"
                  >
                    {plan.ctaLabel}
                  </TrackCta>
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
      <p className="mt-5 type-meta text-cited-ink-subtle">{FOUNDER_LIMIT_NOTE}</p>
      <p className="mt-3">
        <TrackCta
          href={PRICING_TEASER.compareHref}
          cta="compare_plans"
          variant="ghost"
          size="sm"
          asLink
          className="text-sm text-cited-ink-muted underline-offset-4 transition-colors hover:text-cited-ink hover:underline"
        >
          {PRICING_TEASER.compareLabel}
        </TrackCta>
      </p>
    </div>
  );
}
