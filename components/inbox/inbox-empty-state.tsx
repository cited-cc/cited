import { Inbox, Radar } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { DocsLink } from "@/components/guidance/help";
import { EMPTY_STATE_COPY } from "@/lib/content/help";
import { buildInboxHref, clearAdvancedFilters } from "@/lib/inbox/filters";
import type { InboxFilters, InboxView } from "@/lib/inbox/types";

type InboxEmptyStateProps = {
  kind:
    | "no_monitors"
    | "no_evidence"
    | "no_results"
    | "no_saved"
    | "no_archived";
  filters: InboxFilters;
};

export function InboxEmptyState({ kind, filters }: InboxEmptyStateProps) {
  switch (kind) {
    case "no_monitors":
      return (
        <EmptyState
          title={EMPTY_STATE_COPY.inboxNoMonitors.title}
          description={EMPTY_STATE_COPY.inboxNoMonitors.description}
          icon={<Radar className="h-7 w-7" aria-hidden />}
          action={
            <div className="flex flex-wrap items-center gap-3">
              <Button
                href={EMPTY_STATE_COPY.inboxNoMonitors.primaryHref}
                variant="primary"
                size="sm"
              >
                {EMPTY_STATE_COPY.inboxNoMonitors.primaryLabel}
              </Button>
              <DocsLink href={EMPTY_STATE_COPY.inboxNoMonitors.docsHref}>
                {EMPTY_STATE_COPY.inboxNoMonitors.docsLabel}
              </DocsLink>
            </div>
          }
        />
      );
    case "no_evidence":
      return (
        <EmptyState
          title={EMPTY_STATE_COPY.inboxNoEvidence.title}
          description={EMPTY_STATE_COPY.inboxNoEvidence.description}
          icon={<Inbox className="h-7 w-7" aria-hidden />}
          action={
            <div className="flex flex-wrap items-center gap-3">
              <Button
                href={EMPTY_STATE_COPY.inboxNoEvidence.primaryHref}
                variant="secondary"
                size="sm"
              >
                {EMPTY_STATE_COPY.inboxNoEvidence.primaryLabel}
              </Button>
              <DocsLink href={EMPTY_STATE_COPY.inboxNoEvidence.docsHref}>
                {EMPTY_STATE_COPY.inboxNoEvidence.docsLabel}
              </DocsLink>
            </div>
          }
        />
      );
    case "no_saved":
      return (
        <EmptyState
          title="Nothing saved yet."
          description="Save a citation note when you want to keep its evidence close."
          icon={<Inbox className="h-7 w-7" aria-hidden />}
        />
      );
    case "no_archived":
      return (
        <EmptyState
          title="No archived notes."
          description="Archiving clears the active Inbox without removing historical evidence."
          icon={<Inbox className="h-7 w-7" aria-hidden />}
        />
      );
    case "no_results":
      return (
        <EmptyState
          title="No evidence matches this view."
          description="Try clearing a filter, changing the date range, or searching a different prompt or source."
          icon={<Inbox className="h-7 w-7" aria-hidden />}
          action={
            <Button
              href={buildInboxHref(clearAdvancedFilters(filters), {
                search: null,
                view: "all" satisfies InboxView,
                cursor: null,
                selectedEventId: null,
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
