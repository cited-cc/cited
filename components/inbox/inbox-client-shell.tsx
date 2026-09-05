"use client";

import { useEffect, useState } from "react";

import { CitationEventPreviewPanel } from "@/components/inbox/inbox-event-preview-panel";
import { InboxEventList } from "@/components/inbox/inbox-event-list";
import { InboxFilterBar } from "@/components/inbox/inbox-filter-bar";
import { InboxFilterSheet } from "@/components/inbox/inbox-filter-sheet";
import { InboxHeader } from "@/components/inbox/inbox-header";
import { InboxSearch } from "@/components/inbox/inbox-search";
import { InboxTabs } from "@/components/inbox/inbox-tabs";
import { ExportActions } from "@/components/export/export-actions";
import { countActiveAdvancedFilters } from "@/lib/inbox/filters";
import { trackProductEvent } from "@/lib/analytics/product";
import type {
  InboxEventListItem,
  InboxEventPreview,
  InboxFilterOptions,
  InboxFilters,
  InboxTabCounts,
} from "@/lib/inbox/types";

type InboxClientShellProps = {
  filters: InboxFilters;
  items: InboxEventListItem[];
  nextCursor: string | null;
  hasMore: boolean;
  counts: InboxTabCounts;
  options: InboxFilterOptions;
  preview: InboxEventPreview | null;
  canArchive: boolean;
  canResolve: boolean;
  canSave: boolean;
  canExport?: boolean;
  emptyKind:
    | "no_monitors"
    | "no_evidence"
    | "no_results"
    | "no_saved"
    | "no_archived"
    | null;
};

export function InboxClientShell({
  filters,
  items,
  nextCursor,
  hasMore,
  counts,
  options,
  preview,
  canArchive,
  canResolve,
  canSave,
  canExport = false,
  emptyKind,
}: InboxClientShellProps) {
  const [searchOpen, setSearchOpen] = useState(Boolean(filters.search));
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    trackProductEvent("inbox_viewed", {
      selected_tab: filters.view,
    });
  }, [filters.view]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      setSearchOpen(true);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const activeFilterCount = countActiveAdvancedFilters(filters);
  const showPreview = Boolean(preview);

  return (
    <>
      <InboxHeader
        newCount={counts.new}
        activeFilterCount={activeFilterCount}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenFilters={() => setFiltersOpen(true)}
      />

      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        {canExport ? (
          <ExportActions
            canExport={canExport}
            variants={["events-csv", "events-json"]}
          />
        ) : null}

        {searchOpen || filters.search ? (
          <InboxSearch
            filters={filters}
            autoFocus={searchOpen && !filters.search}
            onClose={() => setSearchOpen(false)}
          />
        ) : null}

        <InboxTabs filters={filters} counts={counts} />
        <InboxFilterBar filters={filters} options={options} />

        <div
          className={
            showPreview
              ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]"
              : "grid gap-6"
          }
        >
          <InboxEventList
            items={items}
            filters={filters}
            nextCursor={nextCursor}
            hasMore={hasMore}
            selectedEventId={filters.selectedEventId}
            canArchive={canArchive}
            canResolve={canResolve}
            canSave={canSave}
            emptyKind={emptyKind}
          />

          {preview ? (
            <div className="hidden lg:block">
              <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-hidden rounded-md border border-cited-line">
                <CitationEventPreviewPanel
                  preview={preview}
                  filters={filters}
                  canArchive={canArchive}
                  canResolve={canResolve}
                  canSave={canSave}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <InboxFilterSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        options={options}
      />
    </>
  );
}
