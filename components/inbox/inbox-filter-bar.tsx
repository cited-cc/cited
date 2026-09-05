"use client";

import Link from "next/link";
import { X } from "lucide-react";

import {
  buildInboxHref,
  clearAdvancedFilters,
  countActiveAdvancedFilters,
} from "@/lib/inbox/filters";
import { eventTypeLabel } from "@/lib/inbox/serializers";
import { SURFACE_LABELS } from "@/components/shared/ai-surface-badge";
import type { InboxFilterOptions, InboxFilters } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

type InboxFilterBarProps = {
  filters: InboxFilters;
  options: InboxFilterOptions;
  className?: string;
};

function chipLabel(
  filters: InboxFilters,
  options: InboxFilterOptions,
): Array<{ key: string; label: string; href: string }> {
  const chips: Array<{ key: string; label: string; href: string }> = [];

  for (const type of filters.eventTypes) {
    chips.push({
      key: `type-${type}`,
      label: eventTypeLabel(type),
      href: buildInboxHref(filters, {
        eventTypes: filters.eventTypes.filter((t) => t !== type),
        cursor: null,
      }),
    });
  }

  for (const surface of filters.surfaces) {
    chips.push({
      key: `surface-${surface}`,
      label: SURFACE_LABELS[surface],
      href: buildInboxHref(filters, {
        surfaces: filters.surfaces.filter((s) => s !== surface),
        cursor: null,
      }),
    });
  }

  if (filters.domainId) {
    const domain = options.domains.find((d) => d.id === filters.domainId);
    chips.push({
      key: "domain",
      label: domain?.hostname ?? "Domain",
      href: buildInboxHref(filters, { domainId: null, cursor: null }),
    });
  }

  if (filters.promptId) {
    const prompt = options.prompts.find((p) => p.id === filters.promptId);
    chips.push({
      key: "prompt",
      label: prompt?.name ?? "Prompt",
      href: buildInboxHref(filters, { promptId: null, cursor: null }),
    });
  }

  if (filters.range !== "all") {
    const rangeLabel =
      filters.range === "today"
        ? "Today"
        : filters.range === "7d"
          ? "Last 7 days"
          : filters.range === "30d"
            ? "Last 30 days"
            : filters.range === "custom"
              ? `${filters.customFrom} → ${filters.customTo}`
              : "Date range";
    chips.push({
      key: "range",
      label: rangeLabel,
      href: buildInboxHref(filters, {
        range: "all",
        customFrom: null,
        customTo: null,
        cursor: null,
      }),
    });
  }

  for (const state of filters.memberStates) {
    chips.push({
      key: `state-${state}`,
      label: state,
      href: buildInboxHref(filters, {
        memberStates: filters.memberStates.filter((s) => s !== state),
        cursor: null,
      }),
    });
  }

  if (filters.hasSourceCitation !== null) {
    chips.push({
      key: "has-source",
      label: filters.hasSourceCitation ? "Has source" : "No source",
      href: buildInboxHref(filters, {
        hasSourceCitation: null,
        cursor: null,
      }),
    });
  }

  if (filters.search) {
    chips.push({
      key: "search",
      label: `“${filters.search}”`,
      href: buildInboxHref(filters, { search: null, cursor: null }),
    });
  }

  return chips;
}

export function InboxFilterBar({
  filters,
  options,
  className,
}: InboxFilterBarProps) {
  const chips = chipLabel(filters, options);
  const active = countActiveAdvancedFilters(filters) + (filters.search ? 1 : 0);
  if (active === 0) return null;

  const clearHref = buildInboxHref(clearAdvancedFilters(filters), {
    search: null,
    cursor: null,
    selectedEventId: null,
  });

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          scroll={false}
          className="inline-flex max-w-full items-center gap-1.5 rounded-sm border border-cited-line bg-cited-surface px-2 py-1 font-mono text-[10px] tracking-[0.06em] uppercase text-cited-ink-muted transition hover:border-cited-line-strong hover:text-cited-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent/40"
        >
          <span className="truncate normal-case tracking-normal">{chip.label}</span>
          <X className="h-3 w-3 shrink-0" aria-hidden />
          <span className="sr-only">Remove filter</span>
        </Link>
      ))}
      <Link
        href={clearHref}
        scroll={false}
        className="text-xs text-cited-ink-subtle underline-offset-4 hover:text-cited-ink hover:underline focus-visible:outline-none"
      >
        Clear filters
      </Link>
    </div>
  );
}
