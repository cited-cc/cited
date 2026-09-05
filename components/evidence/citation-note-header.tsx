"use client";

import { CitationNoteActions } from "@/components/evidence/citation-note-actions";
import { CitationNoteMobileActions } from "@/components/evidence/citation-note-mobile-actions";
import { AiSurfaceBadge } from "@/components/shared/ai-surface-badge";
import { EventTypeMarker } from "@/components/inbox/event-type-marker";
import { MemberStateMarker } from "@/components/inbox/member-state-marker";
import type { CitationEventDetail } from "@/lib/evidence/types";
import {
  formatAbsoluteUtc,
  formatRelativeUtc,
} from "@/lib/inbox/serializers";
import type { InboxMemberState } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

type CitationNoteHeaderProps = {
  detail: CitationEventDetail;
  memberState: InboxMemberState;
  onStateChange: (next: InboxMemberState) => void;
  onAddAnnotation?: () => void;
  onCreateNote?: () => void;
  className?: string;
};

export function CitationNoteHeader({
  detail,
  memberState,
  onStateChange,
  onAddAnnotation,
  onCreateNote,
  className,
}: CitationNoteHeaderProps) {
  const { event, permissions } = detail;

  return (
    <header
      className={cn(
        "rounded-md border border-cited-line border-l-[3px] border-l-cited-citation bg-cited-paper/60 px-4 py-5 sm:px-5",
        className,
      )}
    >
      <p className="type-micro text-cited-citation">[ CITATION NOTE ]</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <EventTypeMarker type={event.eventType} />
        {event.aiSurface ? (
          <AiSurfaceBadge surface={event.aiSurface} showMark={false} />
        ) : null}
        <MemberStateMarker state={memberState} />
      </div>

      <h1 className="mt-3 type-heading text-cited-ink-strong">
        {event.summaryTitle}
      </h1>

      {event.domainHostname ? (
        <p className="mt-2 font-mono text-xs text-cited-ink-subtle">
          Domain · {event.domainHostname}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-cited-line-subtle pt-4 font-mono text-[11px] text-cited-ink-muted">
        <span>
          First seen by Cited{" "}
          <time
            dateTime={event.firstSeenAt}
            title={formatAbsoluteUtc(event.firstSeenAt)}
            className="text-cited-ink"
          >
            {formatRelativeUtc(event.firstSeenAt)}
          </time>
        </span>
        <span>
          Last observed by Cited{" "}
          <time
            dateTime={event.lastSeenAt}
            title={formatAbsoluteUtc(event.lastSeenAt)}
            className="text-cited-ink"
          >
            {formatRelativeUtc(event.lastSeenAt)}
          </time>
        </span>
        <span>
          Observed{" "}
          <span className="text-cited-ink">
            {event.occurrenceCount}{" "}
            {event.occurrenceCount === 1 ? "time" : "times"}
          </span>
        </span>
      </div>

      <div className="mt-4 hidden sm:block">
        <CitationNoteActions
          eventId={event.id}
          memberState={memberState}
          canArchive={permissions.canArchive}
          canResolve={permissions.canResolve}
          canSave={permissions.canSave}
          canCreateNote={permissions.canCreateNote}
          canAnnotate={permissions.canAnnotate}
          onStateChange={onStateChange}
          onAddAnnotation={onAddAnnotation}
          onCreateNote={onCreateNote}
        />
      </div>

      <div className="mt-4 sm:hidden">
        <CitationNoteMobileActions
          eventId={event.id}
          memberState={memberState}
          canArchive={permissions.canArchive}
          canResolve={permissions.canResolve}
          canSave={permissions.canSave}
          canCreateNote={permissions.canCreateNote}
          canAnnotate={permissions.canAnnotate}
          onStateChange={onStateChange}
          onAddAnnotation={onAddAnnotation}
          onCreateNote={onCreateNote}
        />
      </div>
    </header>
  );
}
