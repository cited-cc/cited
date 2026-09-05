import { TrackCta } from "@/components/marketing/track-cta";
import {
  FOUNDER_LIMIT_NOTE,
  PUBLIC_PLAN_LIST,
  type PublicPlanKey,
} from "@/lib/content/plans";
import { getPlanCtaHref } from "@/lib/marketing/cta";
import { PLAN_ENTITLEMENTS } from "@/lib/entitlements/plan-entitlements";
import { cn } from "@/lib/utils";

type PricingCardsProps = {
  authenticated?: boolean;
  className?: string;
};

function planMeta(planKey: PublicPlanKey) {
  const entitlements = PLAN_ENTITLEMENTS[planKey];
  const cadence =
    planKey === "pro" || planKey === "portfolio"
      ? "Daily"
      : planKey === "founder" || planKey === "growth"
        ? "Twice-weekly"
        : "Manual";
  const surfaces =
    planKey === "founder" ? "ChatGPT, Gemini" : "Supported surfaces";
  const alerts = "Email";
  const history =
    entitlements.historyDays === null
      ? "Expanded"
      : entitlements.historyDays >= 365
        ? "1 year"
        : `${entitlements.historyDays} days`;

  return {
    bestFor:
      planKey === "founder"
        ? "Founders who want a focused citation inbox"
        : planKey === "growth"
          ? "Teams watching a broader set of prompts"
          : planKey === "pro"
            ? "High-intent teams that need closer cadence"
            : "Agencies and multi-brand teams monitoring several domains",
    prompts: `${entitlements.activePrompts} prompts`,
    domains:
      entitlements.maxDomains === 1
        ? "1 domain"
        : `${entitlements.maxDomains} domains`,
    cadence,
    surfaces,
    alerts,
    history,
  };
}

export function PricingCards({
  authenticated = false,
  className,
}: PricingCardsProps) {
  const plans = PUBLIC_PLAN_LIST;

  return (
    <div className={cn(className)}>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const highlighted = Boolean(plan.highlighted);
          const meta = planMeta(plan.key);

          return (
            <article
              key={plan.key}
              className={cn(
                "cited-paper-texture flex flex-col rounded-md border border-l-[3px] p-6 cited-note-shadow",
                highlighted
                  ? "border-cited-citation/45 border-l-cited-citation ring-1 ring-cited-citation/15"
                  : "border-cited-line border-l-cited-line-strong",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="type-micro text-cited-citation">
                    [ {plan.name.toUpperCase()} PLAN ]
                  </p>
                  <h2 className="mt-2 type-title text-[1.15rem] text-cited-ink-strong">
                    {plan.name}
                  </h2>
                  <p className="mt-2 type-body-sm">{plan.tagline}</p>
                </div>
              </div>

              <p className="mt-6 font-mono text-3xl tracking-tight text-cited-ink-strong">
                {plan.priceLabel}
              </p>

              <dl className="mt-6 space-y-2.5 border-t border-cited-line-subtle pt-5">
                <MetaRow label="Best for" value={meta.bestFor} />
                <MetaRow label="Domain limit" value={meta.domains} />
                <MetaRow label="Prompt limit" value={meta.prompts} />
                <MetaRow label="Cadence" value={meta.cadence} />
                <MetaRow label="Surfaces" value={meta.surfaces} />
                <MetaRow label="Alerts" value={meta.alerts} />
                <MetaRow label="History" value={meta.history} />
              </dl>

              <ul className="mt-5 flex-1 space-y-2">
                {plan.features
                  .filter((feature) => feature.included)
                  .slice(0, 4)
                  .map((feature) => (
                    <li
                      key={feature.label}
                      className="flex items-start gap-2 type-body-sm text-cited-ink-muted"
                    >
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cited-accent"
                        aria-hidden
                      />
                      {feature.label}
                    </li>
                  ))}
              </ul>

              <div className="mt-8">
                <TrackCta
                  href={getPlanCtaHref({
                    plan: plan.key as PublicPlanKey,
                    authenticated,
                  })}
                  cta={`pricing_${plan.key}`}
                  event="marketing_pricing_plan_selected"
                  payload={{ plan: plan.key }}
                  variant={highlighted ? "primary" : "secondary"}
                  size="md"
                  className="w-full"
                >
                  {plan.ctaLabel}
                </TrackCta>
              </div>
            </article>
          );
        })}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="type-meta text-cited-ink-subtle">{FOUNDER_LIMIT_NOTE}</p>
        <TrackCta href="/scan" cta="pricing_check_domain" variant="ghost" size="sm">
          Check a domain first
        </TrackCta>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="type-micro shrink-0 text-cited-ink-faint">{label}</dt>
      <dd className="text-right type-citation-meta text-cited-ink-muted">
        {value}
      </dd>
    </div>
  );
}
