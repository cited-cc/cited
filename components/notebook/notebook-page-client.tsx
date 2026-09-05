"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { NotebookEmptyState } from "@/components/notebook/notebook-empty-state";
import { NotebookEntryCard } from "@/components/notebook/notebook-entry-card";
import { NotebookEntryEditor } from "@/components/notebook/notebook-entry-editor";
import { NotebookFilterBar } from "@/components/notebook/notebook-filter-bar";
import { NotebookHeader } from "@/components/notebook/notebook-header";
import { NotebookLinkEventPicker } from "@/components/notebook/notebook-link-event-picker";
import { NotebookPinnedSection } from "@/components/notebook/notebook-pinned-section";
import { NotebookTabs } from "@/components/notebook/notebook-tabs";
import { ExportActions } from "@/components/export/export-actions";
import { Button } from "@/components/ui/button";
import {
  buildNotebookHref,
  countActiveNotebookFilters,
} from "@/lib/notebook/query-state";
import type {
  NotebookCounts,
  NotebookEntryListItem,
  NotebookFilters,
} from "@/lib/notebook/types";

type NotebookPageClientProps = {
  filters: NotebookFilters;
  counts: NotebookCounts;
  items: NotebookEntryListItem[];
  hasMore: boolean;
  nextCursor: string | null;
  canCreate: boolean;
  canExport?: boolean;
  createEventId?: string | null;
  startCreating?: boolean;
};

export function NotebookPageClient({
  filters,
  counts,
  items,
  hasMore,
  nextCursor,
  canCreate,
  canExport = false,
  createEventId = null,
  startCreating = false,
}: NotebookPageClientProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(startCreating && canCreate);
  const activeFilters = countActiveNotebookFilters(filters) > 0 || Boolean(filters.search);

  const pinnedItems = useMemo(
    () =>
      filters.view === "all"
        ? items.filter((item) => item.pinned && !item.archivedAt)
        : [],
    [filters.view, items],
  );

  const listItems = useMemo(() => {
    if (filters.view === "all" && pinnedItems.length > 0) {
      return items.filter((item) => !item.pinned);
    }
    return items;
  }, [filters.view, items, pinnedItems.length]);

  function emptyKind():
    | "empty"
    | "no_results"
    | "no_pinned"
    | "no_linked"
    | "no_private"
    | "no_archived" {
    if (activeFilters) return "no_results";
    switch (filters.view) {
      case "pinned":
        return "no_pinned";
      case "linked":
        return "no_linked";
      case "private":
        return "no_private";
      case "archived":
        return "no_archived";
      case "all":
        return "empty";
      default: {
        const _exhaustive: never = filters.view;
        return _exhaustive;
      }
    }
  }

  return (
    <>
      <NotebookHeader
        canCreate={canCreate}
        onCreate={() => setCreating(true)}
      />

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {canExport ? (
          <ExportActions canExport={canExport} variants={["notebook-md"]} />
        ) : null}
        <NotebookTabs filters={filters} counts={counts} />
        <NotebookFilterBar filters={filters} />

        {creating ? (
          <div className="space-y-3">
            <NotebookLinkEventPicker citationEventId={createEventId} />
            <NotebookEntryEditor
              mode="create"
              citationEventId={createEventId}
              onCancel={() => setCreating(false)}
              onSaved={(entryId) => {
                setCreating(false);
                router.push(`/app/notebook/${entryId}`);
              }}
            />
          </div>
        ) : null}

        {items.length === 0 && !creating ? (
          <NotebookEmptyState
            kind={emptyKind()}
            filters={filters}
            canCreate={canCreate}
            onCreate={() => setCreating(true)}
          />
        ) : (
          <div className="space-y-8">
            {pinnedItems.length > 0 ? (
              <NotebookPinnedSection items={pinnedItems} />
            ) : null}

            {listItems.length > 0 ? (
              <section aria-label="Notebook notes">
                {filters.view === "all" && pinnedItems.length > 0 ? (
                  <p className="mb-3 type-micro text-cited-ink-faint">All notes</p>
                ) : null}
                <ul className="space-y-2">
                  {listItems.map((entry) => (
                    <li key={entry.id}>
                      <NotebookEntryCard entry={entry} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {hasMore && nextCursor ? (
              <div className="flex justify-center">
                <Button
                  href={buildNotebookHref(filters, { cursor: nextCursor })}
                  variant="secondary"
                  size="sm"
                >
                  Load more
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
