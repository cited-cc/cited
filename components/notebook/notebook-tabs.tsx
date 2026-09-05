"use client";

import Link from "next/link";

import { buildNotebookHref } from "@/lib/notebook/query-state";
import type {
  NotebookCounts,
  NotebookFilters,
  NotebookView,
} from "@/lib/notebook/types";
import { cn } from "@/lib/utils";

const TAB_DEFS: Array<{
  view: NotebookView;
  label: string;
  countKey: keyof NotebookCounts;
}> = [
  { view: "all", label: "All", countKey: "all" },
  { view: "pinned", label: "Pinned", countKey: "pinned" },
  { view: "linked", label: "Linked", countKey: "linked" },
  { view: "private", label: "Private", countKey: "private" },
  { view: "archived", label: "Archived", countKey: "archived" },
];

type NotebookTabsProps = {
  filters: NotebookFilters;
  counts: NotebookCounts | null;
  className?: string;
};

export function NotebookTabs({
  filters,
  counts,
  className,
}: NotebookTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Notebook views"
      className={cn(
        "-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]",
        className,
      )}
    >
      {TAB_DEFS.map((tab) => {
        const selected = filters.view === tab.view;
        const href = buildNotebookHref(filters, {
          view: tab.view,
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
