"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { AiSurfaceBadge } from "@/components/shared/ai-surface-badge";
import { HighlightedEvidence } from "@/components/shared/highlighted-evidence";
import { EventTypeMarker } from "@/components/inbox/event-type-marker";
import { InboxOccurrenceSummary } from "@/components/inbox/inbox-occurrence-summary";
import { InboxStatusActions } from "@/components/inbox/inbox-status-actions";
import { MemberStateMarker } from "@/components/inbox/member-state-marker";
import { SourceEvidenceCard } from "@/components/inbox/source-evidence-card";
import { Button } from "@/components/ui/button";
import { markEventSeenAction } from "@/lib/inbox/actions";
import { buildInboxHref } from "@/lib/inbox/filters";
import {
  buildEventSummary,
  matchConfidenceLabel,
} from "@/lib/inbox/serializers";
import type {
  InboxEventPreview,
  InboxFilters,
  InboxMemberState,
} from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

type CitationEventPreviewPanelProps = {
  preview: InboxEventPreview;
  filters: InboxFilters;
  canArchive: boolean;
  canResolve: boolean;
  canSave: boolean;
  className?: string;
};

export function CitationEventPreviewPanel({
  preview,
  filters,
  canArchive,
  canResolve,
  canSave,
  className,
}: CitationEventPreviewPanelProps) {
  const [override, setOverride] = useState<{
    eventId: string;
    memberState: InboxMemberState;
  } | null>(null);

  const memberState =
    override?.eventId === preview.event.id
      ? override.memberState
      : preview.event.memberState;

  const summary = buildEventSummary({ ...preview.event, memberState });
  const confidence = matchConfidenceLabel(
    preview.event.confidenceScore,
    preview.event.eventType,
  );
  const closeHref = buildInboxHref(filters, { selectedEventId: null });
  const focusedHref = `/app/inbox/${preview.event.id}`;
  const markedRef = useRef<string | null>(null);

  useEffect(() => {
    if (preview.event.memberState.seenAt) return;
    if (markedRef.current === preview.event.id) return;
    markedRef.current = preview.event.id;
    void markEventSeenAction(preview.event.id).then((result) => {
      if (result.ok) {
        setOverride({
          eventId: preview.event.id,
          memberState: result.memberState,
        });
      }
    });
  }, [preview.event.id, preview.event.memberState.seenAt]);

  function handleStateChange(next: InboxMemberState) {
    setOverride({ eventId: preview.event.id, memberState: next });
  }

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col border-l border-cited-line-subtle bg-cited-canvas-elevated",
        className,
      )}
      aria-label="Citation evidence preview"
    >
      <div className="flex items-start justify-between gap-3 border-b border-cited-line-subtle px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <EventTypeMarker type={preview.event.eventType} />
            {preview.event.aiSurface ? (
              <AiSurfaceBadge surface={preview.event.aiSurface} showMark={false} />
            ) : null}
            <MemberStateMarker state={memberState} />
          </div>
          <h2 className="mt-2 type-title text-cited-ink-strong">{summary}</h2>
        </div>
        <Button
          href={closeHref}
          variant="ghost"
          size="icon"
          aria-label="Close preview"
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        <section>
          <p className="type-micro text-cited-ink-faint">Prompt</p>
          <p className="mt-2 type-body-sm text-cited-ink">
            {preview.event.promptText ??
              "Prompt text was not retained for this result."}
          </p>
        </section>

        <section>
          <p className="type-micro text-cited-ink-faint">Evidence</p>
          <div className="mt-2">
            {preview.responseExcerpt ? (
              <HighlightedEvidence text={preview.responseExcerpt} />
            ) : (
              <p className="type-body-sm text-cited-ink-muted">
                No response excerpt was retained for this result.
              </p>
            )}
          </div>
          {confidence ? (
            <p className="mt-2 font-mono text-[11px] text-cited-ink-subtle">
              Match confidence: {confidence}
            </p>
          ) : null}
        </section>

        <SourceEvidenceCard event={{ ...preview.event, memberState }} />

        <section>
          <p className="type-micro text-cited-ink-faint">History</p>
          <div className="mt-2">
            <InboxOccurrenceSummary
              firstSeenAt={preview.event.firstSeenAt}
              lastSeenAt={preview.event.lastSeenAt}
              occurrenceCount={preview.event.occurrenceCount}
              recentOccurrences={preview.recentOccurrences}
            />
          </div>
        </section>

        <section>
          <p className="type-micro text-cited-ink-faint">Status</p>
          <div className="mt-2">
            <InboxStatusActions
              eventId={preview.event.id}
              memberState={memberState}
              canArchive={canArchive}
              canResolve={canResolve}
              canSave={canSave}
              onStateChange={handleStateChange}
            />
          </div>
        </section>
      </div>

      <div className="border-t border-cited-line-subtle px-4 py-3">
        <Button href={focusedHref} variant="secondary" size="sm" className="w-full">
          Open focused note
        </Button>
        <p className="mt-2 text-center">
          <Link
            href={closeHref}
            className="type-meta text-cited-ink-faint underline-offset-4 hover:underline"
          >
            Back to list
          </Link>
        </p>
      </div>
    </aside>
  );
}
