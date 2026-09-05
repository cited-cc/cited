"use client";

import Link from "next/link";

import { buildInboxHref } from "@/lib/inbox/filters";
import type { InboxFilters, InboxTabCounts, InboxView } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

const TAB_DEFS: Array<{
  view: InboxView;
  label: string;
  countKey: keyof InboxTabCounts;
}> = [
  { view: "all", label: "All", countKey: "all" },
  { view: "new", label: "New", countKey: "new" },
  { view: "citations", label: "Citations", countKey: "citations" },
  { view: "mentions", label: "Mentions", countKey: "mentions" },
  {
    view: "recommendations",
    label: "Recommendations",
    countKey: "recommendations",
  },
  { view: "opportunities", label: "Opportunities", countKey: "opportunities" },
  { view: "saved", label: "Saved", countKey: "saved" },
  { view: "archived", label: "Archived", countKey: "archived" },
];

type InboxTabsProps = {
  filters: InboxFilters;
  counts: InboxTabCounts | null;
  className?: string;
};

export function InboxTabs({ filters, counts, className }: InboxTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Inbox views"
      className={cn(
        "-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]",
        className,
      )}
    >
      {TAB_DEFS.map((tab) => {
        const selected = filters.view === tab.view;
        const href = buildInboxHref(filters, {
          view: tab.view,
          selectedEventId: null,
          cursor: null,
        });
        const count = counts ? counts[tab.countKey] : null;

        return (
          <Link
            key={tab.view}
            href={href}
            role="tab"
            aria-selected={selected}
            scroll={false}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-sm px-3 py-1.5 font-mono text-[11px] tracking-[0.06em] uppercase transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent/50",
              selected
                ? "bg-cited-surface-raised text-cited-ink-strong"
                : "text-cited-ink-subtle hover:text-cited-ink",
            )}
          >
            {tab.label}
            {count !== null ? (
              <span
                className={cn(
                  "tabular-nums",
                  selected ? "text-cited-accent" : "text-cited-ink-faint",
                )}
              >
                {count}
              </span>
            ) : (
              <span className="inline-block h-3 w-4 animate-pulse rounded-sm bg-cited-surface-hover/80" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
