"use client";

import { useRouter } from "next/navigation";

import { NotebookSearch } from "@/components/notebook/notebook-search";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  buildNotebookHref,
  clearNotebookFilters,
  countActiveNotebookFilters,
} from "@/lib/notebook/query-state";
import type { NotebookFilters } from "@/lib/notebook/types";
import { AI_SURFACE_KEYS, CITATION_EVENT_TYPES } from "@/types/product";
import { cn } from "@/lib/utils";

type NotebookFilterBarProps = {
  filters: NotebookFilters;
  className?: string;
};

export function NotebookFilterBar({
  filters,
  className,
}: NotebookFilterBarProps) {
  const router = useRouter();
  const active = countActiveNotebookFilters(filters);

  function navigate(overrides: Partial<NotebookFilters>) {
    router.push(buildNotebookHref(filters, { ...overrides, cursor: null }), {
      scroll: false,
    });
  }

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      <NotebookSearch filters={filters} className="sm:max-w-xs sm:flex-1" />

      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label="Visibility filter"
          className="h-10 w-auto min-w-[120px] text-xs sm:h-8"
          value={filters.visibility ?? ""}
          onChange={(e) => {
            const visibility =
              e.target.value === "workspace" || e.target.value === "private"
                ? e.target.value
                : null;
            navigate({ visibility });
          }}
        >
          <option value="">Visibility</option>
          <option value="workspace">Workspace</option>
          <option value="private">Private</option>
        </Select>

        <Select
          aria-label="Event type filter"
          className="h-10 w-auto min-w-[140px] text-xs sm:h-8"
          value={filters.eventType ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            const eventType = CITATION_EVENT_TYPES.includes(
              value as (typeof CITATION_EVENT_TYPES)[number],
            )
              ? (value as (typeof CITATION_EVENT_TYPES)[number])
              : null;
            navigate({ eventType });
          }}
        >
          <option value="">Event type</option>
          {CITATION_EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replaceAll("_", " ")}
            </option>
          ))}
        </Select>

        <Select
          aria-label="AI surface filter"
          className="h-10 w-auto min-w-[140px] text-xs sm:h-8"
          value={filters.surface ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            const surface = AI_SURFACE_KEYS.includes(
              value as (typeof AI_SURFACE_KEYS)[number],
            )
              ? (value as (typeof AI_SURFACE_KEYS)[number])
              : null;
            navigate({ surface });
          }}
        >
          <option value="">Surface</option>
          {AI_SURFACE_KEYS.map((surface) => (
            <option key={surface} value={surface}>
              {surface.replaceAll("_", " ")}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Date range filter"
          className="h-10 w-auto min-w-[110px] text-xs sm:h-8"
          value={filters.range}
          onChange={(e) => {
            const range = e.target.value as NotebookFilters["range"];
            navigate({ range });
          }}
        >
          <option value="all">All time</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </Select>

        {active > 0 ? (
          <Button
            href={buildNotebookHref(clearNotebookFilters(filters))}
            variant="ghost"
            size="xs"
          >
            Clear ({active})
          </Button>
        ) : null}
      </div>
    </div>
  );
}
