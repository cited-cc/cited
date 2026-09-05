import Link from "next/link";
import { Pin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { NotebookEntryListItem } from "@/lib/notebook/types";
import {
  formatAbsoluteUtc,
  formatRelativeUtc,
} from "@/lib/inbox/serializers";
import { cn } from "@/lib/utils";

type NotebookEntryCardProps = {
  entry: NotebookEntryListItem;
  className?: string;
};

export function NotebookEntryCard({
  entry,
  className,
}: NotebookEntryCardProps) {
  return (
    <Link
      href={`/app/notebook/${entry.id}`}
      className={cn(
        "block rounded-md border border-cited-line border-l-2 border-l-cited-accent bg-cited-surface-raised px-4 py-3 transition hover:border-cited-line-strong hover:bg-cited-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent/50 cited-note-shadow",
        entry.archivedAt && "opacity-70",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {entry.pinned ? (
            <Pin className="h-3.5 w-3.5 text-cited-accent" aria-label="Pinned" />
          ) : null}
          <Badge
            variant={entry.visibility === "private" ? "neutral" : "success"}
          >
            {entry.visibility === "private" ? "Private" : "Workspace"}
          </Badge>
          {entry.linkedEvent ? (
            <Badge variant="citation">Linked</Badge>
          ) : null}
          {entry.archivedAt ? <Badge variant="default">Archived</Badge> : null}
        </div>
        <time
          dateTime={entry.updatedAt}
          title={formatAbsoluteUtc(entry.updatedAt)}
          className="shrink-0 font-mono text-[11px] text-cited-ink-faint"
        >
          {formatRelativeUtc(entry.updatedAt)}
        </time>
      </div>

      <h3 className="mt-2 type-title text-cited-ink-strong">{entry.title}</h3>
      {entry.bodyPreview ? (
        <p className="mt-1.5 type-body-sm line-clamp-2 text-cited-ink-muted">
          {entry.bodyPreview}
        </p>
      ) : null}

      {entry.linkedEvent ? (
        <p className="mt-2 font-mono text-[11px] text-cited-ink-faint">
          Linked · {entry.linkedEvent.summaryTitle}
        </p>
      ) : null}
    </Link>
  );
}
