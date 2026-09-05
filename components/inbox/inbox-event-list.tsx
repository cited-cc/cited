"use client";

import { useState } from "react";

import { InboxBulkActions } from "@/components/inbox/inbox-bulk-actions";
import { InboxEmptyState } from "@/components/inbox/inbox-empty-state";
import { InboxEventNoteCard } from "@/components/inbox/inbox-event-note-card";
import { InboxLoadMore } from "@/components/inbox/inbox-load-more";
import {
  INBOX_BULK_SELECTION_CAP,
  type InboxEventListItem,
  type InboxFilters,
} from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

type InboxEventListProps = {
  items: InboxEventListItem[];
  filters: InboxFilters;
  nextCursor: string | null;
  hasMore: boolean;
  selectedEventId: string | null;
  canArchive: boolean;
  canResolve: boolean;
  canSave: boolean;
  emptyKind:
    | "no_monitors"
    | "no_evidence"
    | "no_results"
    | "no_saved"
    | "no_archived"
    | null;
  className?: string;
};

export function InboxEventList({
  items: initialItems,
  filters,
  nextCursor: initialCursor,
  hasMore: initialHasMore,
  selectedEventId,
  canArchive,
  canResolve,
  canSave,
  emptyKind,
  className,
}: InboxEventListProps) {
  const filterKey = JSON.stringify({
    view: filters.view,
    eventTypes: filters.eventTypes,
    surfaces: filters.surfaces,
    domainId: filters.domainId,
    promptId: filters.promptId,
    range: filters.range,
    customFrom: filters.customFrom,
    customTo: filters.customTo,
    memberStates: filters.memberStates,
    hasSourceCitation: filters.hasSourceCitation,
    search: filters.search,
  });

  const [loadedPages, setLoadedPages] = useState<{
    filterKey: string;
    extraItems: InboxEventListItem[];
    nextCursor: string | null;
    hasMore: boolean;
  }>({
    filterKey,
    extraItems: [],
    nextCursor: initialCursor,
    hasMore: initialHasMore,
  });

  const [selected, setSelected] = useState<{
    filterKey: string;
    ids: string[];
  }>({ filterKey, ids: [] });

  const pageState =
    loadedPages.filterKey === filterKey
      ? loadedPages
      : {
          filterKey,
          extraItems: [] as InboxEventListItem[],
          nextCursor: initialCursor,
          hasMore: initialHasMore,
        };

  const selectedIds =
    selected.filterKey === filterKey ? selected.ids : [];

  const seen = new Set(initialItems.map((item) => item.id));
  const items =
    pageState.extraItems.length === 0
      ? initialItems
      : [
          ...initialItems,
          ...pageState.extraItems.filter((item) => !seen.has(item.id)),
        ];

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const base =
        prev.filterKey === filterKey ? prev.ids : ([] as string[]);
      let next = base;
      if (checked) {
        if (base.includes(id)) return { filterKey, ids: base };
        if (base.length >= INBOX_BULK_SELECTION_CAP) {
          return { filterKey, ids: base };
        }
        next = [...base, id];
      } else {
        next = base.filter((value) => value !== id);
      }
      return { filterKey, ids: next };
    });
  }

  if (items.length === 0 && emptyKind) {
    return <InboxEmptyState kind={emptyKind} filters={filters} />;
  }

  return (
    <div className={cn("relative space-y-3", className)}>
      <ul className="space-y-3" aria-label="Citation notes">
        {items.map((item) => (
          <li key={item.id}>
            <InboxEventNoteCard
              item={item}
              filters={filters}
              selected={selectedEventId === item.id}
              selectable
              checked={selectedIds.includes(item.id)}
              onCheckedChange={(checked) => toggle(item.id, checked)}
              canArchive={canArchive}
              canResolve={canResolve}
              canSave={canSave}
              desktopPreview
            />
          </li>
        ))}
      </ul>

      {pageState.hasMore && pageState.nextCursor ? (
        <InboxLoadMore
          filters={filters}
          nextCursor={pageState.nextCursor}
          onLoaded={(result) => {
            setLoadedPages((prev) => {
              const base =
                prev.filterKey === filterKey
                  ? prev
                  : {
                      filterKey,
                      extraItems: [],
                      nextCursor: initialCursor,
                      hasMore: initialHasMore,
                    };
              return {
                filterKey,
                extraItems: [...base.extraItems, ...result.items],
                nextCursor: result.nextCursor,
                hasMore: result.hasMore,
              };
            });
          }}
        />
      ) : null}

      <InboxBulkActions
        selectedIds={selectedIds}
        canArchive={canArchive}
        onClear={() => setSelected({ filterKey, ids: [] })}
      />
    </div>
  );
}
