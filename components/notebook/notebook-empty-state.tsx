import { BookMarked, Pin, Link2, Lock, Archive } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { buildNotebookHref, clearNotebookFilters } from "@/lib/notebook/query-state";
import type { NotebookFilters, NotebookView } from "@/lib/notebook/types";

type NotebookEmptyStateProps = {
  kind:
    | "empty"
    | "no_results"
    | "no_pinned"
    | "no_linked"
    | "no_private"
    | "no_archived";
  filters: NotebookFilters;
  canCreate?: boolean;
  onCreate?: () => void;
};

export function NotebookEmptyState({
  kind,
  filters,
  canCreate = false,
  onCreate,
}: NotebookEmptyStateProps) {
  switch (kind) {
    case "empty":
      return (
        <EmptyState
          title="Notebook is empty"
          description="Save citation slips, annotate what changed, and keep a private ledger of the moments worth revisiting."
          icon={<BookMarked className="h-7 w-7" aria-hidden />}
          action={
            canCreate && onCreate ? (
              <Button type="button" variant="primary" size="sm" onClick={onCreate}>
                Create note
              </Button>
            ) : (
              <Button href="/app/inbox" variant="secondary" size="sm">
                Open Inbox
              </Button>
            )
          }
        />
      );
    case "no_pinned":
      return (
        <EmptyState
          title="No pinned notes"
          description="Pin a note when you want it to stay at the top of your Notebook."
          icon={<Pin className="h-7 w-7" aria-hidden />}
        />
      );
    case "no_linked":
      return (
        <EmptyState
          title="No linked notes"
          description="Create a notebook note from a citation note to keep the evidence and your commentary together."
          icon={<Link2 className="h-7 w-7" aria-hidden />}
          action={
            <Button href="/app/inbox" variant="secondary" size="sm">
              Open Inbox
            </Button>
          }
        />
      );
    case "no_private":
      return (
        <EmptyState
          title="No private notes"
          description="Private notes are only visible to you. Create one when the commentary should stay personal."
          icon={<Lock className="h-7 w-7" aria-hidden />}
        />
      );
    case "no_archived":
      return (
        <EmptyState
          title="No archived notes"
          description="Archiving clears the active Notebook without deleting the note."
          icon={<Archive className="h-7 w-7" aria-hidden />}
        />
      );
    case "no_results":
      return (
        <EmptyState
          title="No notes match this view"
          description="Try clearing a filter, changing the date range, or searching a different title."
          icon={<BookMarked className="h-7 w-7" aria-hidden />}
          action={
            <Button
              href={buildNotebookHref(clearNotebookFilters(filters), {
                search: null,
                view: "all" satisfies NotebookView,
                cursor: null,
              })}
              variant="secondary"
              size="sm"
            >
              Clear filters
            </Button>
          }
        />
      );
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
