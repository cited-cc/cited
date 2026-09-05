"use client";

import Link from "next/link";
import { CircleHelp } from "lucide-react";

import { Popover } from "@/components/ui/tooltip";
import {
  getTerminology,
  type TerminologyKey,
} from "@/lib/content/terminology";
import { cn } from "@/lib/utils";

type HelpTooltipProps = {
  content: React.ReactNode;
  label?: string;
  className?: string;
};

export function HelpTooltip({
  content,
  label = "More information",
  className,
}: HelpTooltipProps) {
  return (
    <Popover
      className="min-w-[220px] max-w-xs p-3"
      trigger={
        <button
          type="button"
          className={cn(
            "inline-flex h-5 w-5 items-center justify-center rounded-sm text-cited-ink-subtle transition hover:text-cited-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent",
            className,
          )}
          aria-label={label}
        >
          <CircleHelp className="h-3.5 w-3.5" aria-hidden />
        </button>
      }
    >
      <div className="type-body-sm text-cited-ink">{content}</div>
    </Popover>
  );
}

export function InlineHelp({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("type-meta text-cited-ink-subtle", className)}>
      {children}
    </p>
  );
}

export function DocsLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "text-sm text-cited-accent underline-offset-4 hover:underline",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function TerminologyPopover({
  term,
  className,
}: {
  term: TerminologyKey;
  className?: string;
}) {
  const definition = getTerminology(term);
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span>{definition.label}</span>
      <HelpTooltip
        label={`About ${definition.label}`}
        content={
          <div className="space-y-2">
            <p>{definition.short}</p>
            <DocsLink href={definition.docsHref}>Read more</DocsLink>
          </div>
        }
      />
    </span>
  );
}

export function ContextualHelpCard({
  title,
  children,
  docsHref,
  docsLabel = "Read docs",
  className,
}: {
  title: string;
  children: React.ReactNode;
  docsHref?: string;
  docsLabel?: string;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "rounded-md border border-cited-line bg-cited-surface px-4 py-3",
        className,
      )}
    >
      <p className="type-micro text-cited-ink-faint">{title}</p>
      <div className="mt-2 type-body-sm text-cited-ink-muted">{children}</div>
      {docsHref ? (
        <div className="mt-3">
          <DocsLink href={docsHref}>{docsLabel}</DocsLink>
        </div>
      ) : null}
    </aside>
  );
}

export function EmptyStateEducation({
  title,
  description,
  primary,
  docs,
  className,
}: {
  title: string;
  description: string;
  primary?: { href: string; label: string };
  docs?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start rounded-md border border-dashed border-cited-line bg-cited-surface/60 px-6 py-10",
        className,
      )}
    >
      <h2 className="type-title text-cited-ink-strong">{title}</h2>
      <p className="mt-2 max-w-lg type-body text-cited-ink-muted">
        {description}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {primary ? (
          <Link
            href={primary.href}
            className="inline-flex items-center rounded-md bg-cited-accent px-3 py-1.5 text-sm font-medium text-cited-canvas transition hover:opacity-90"
          >
            {primary.label}
          </Link>
        ) : null}
        {docs ? <DocsLink href={docs.href}>{docs.label}</DocsLink> : null}
      </div>
    </div>
  );
}

export function PlanLimitExplainer({
  resourceLabel,
  currentUsage,
  limit,
  currentPlanName,
  upgradePlanName,
  billingHref = "/app/billing",
  docsHref = "/docs/billing-and-limits",
}: {
  resourceLabel: string;
  currentUsage: number;
  limit: number;
  currentPlanName: string;
  upgradePlanName?: string | null;
  billingHref?: string;
  docsHref?: string;
}) {
  return (
    <ContextualHelpCard
      title="Plan limit"
      docsHref={docsHref}
      docsLabel="Billing and limits"
    >
      <p>
        You&apos;ve reached {currentUsage} of {limit} {resourceLabel} on{" "}
        {currentPlanName}.
      </p>
      {upgradePlanName ? (
        <p className="mt-2">
          Upgrade to {upgradePlanName} for a higher limit.{" "}
          <Link href={billingHref} className="underline underline-offset-4">
            Open billing
          </Link>
        </p>
      ) : (
        <p className="mt-2">
          <Link href={billingHref} className="underline underline-offset-4">
            Review billing
          </Link>{" "}
          for available options.
        </p>
      )}
    </ContextualHelpCard>
  );
}
