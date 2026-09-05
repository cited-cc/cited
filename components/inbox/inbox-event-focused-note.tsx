"use client";

import Link from "next/link";
import { useState } from "react";

import { AiSurfaceBadge } from "@/components/shared/ai-surface-badge";
import { HighlightedEvidence } from "@/components/shared/highlighted-evidence";
import { EventTypeMarker } from "@/components/inbox/event-type-marker";
import { InboxOccurrenceSummary } from "@/components/inbox/inbox-occurrence-summary";
import { InboxStatusActions } from "@/components/inbox/inbox-status-actions";
import { MemberStateMarker } from "@/components/inbox/member-state-marker";
import { SourceEvidenceCard } from "@/components/inbox/source-evidence-card";
import { Button } from "@/components/ui/button";
import {
  buildEventSummary,
  matchConfidenceLabel,
} from "@/lib/inbox/serializers";
import type { InboxEventPreview, InboxMemberState } from "@/lib/inbox/types";

type InboxEventFocusedNoteProps = {
  preview: InboxEventPreview;
  backHref: string;
  canArchive: boolean;
  canResolve: boolean;
  canSave: boolean;
};

export function InboxEventFocusedNote({
  preview,
  backHref,
  canArchive,
  canResolve,
  canSave,
}: InboxEventFocusedNoteProps) {
  const [memberState, setMemberState] = useState(preview.event.memberState);
  const summary = buildEventSummary({ ...preview.event, memberState });
  const confidence = matchConfidenceLabel(
    preview.event.confidenceScore,
    preview.event.eventType,
  );

  function handleStateChange(next: InboxMemberState) {
    setMemberState(next);
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <Button href={backHref} variant="ghost" size="sm">
          Back to Inbox
        </Button>
      </div>

      <header className="border-b border-cited-line-subtle pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <EventTypeMarker type={preview.event.eventType} />
          {preview.event.aiSurface ? (
            <AiSurfaceBadge surface={preview.event.aiSurface} showMark={false} />
          ) : null}
          <MemberStateMarker state={memberState} />
        </div>
        <h1 className="mt-3 type-heading text-cited-ink-strong">{summary}</h1>
        {preview.event.domainHostname ? (
          <p className="mt-2 font-mono text-xs text-cited-ink-subtle">
            Domain · {preview.event.domainHostname}
          </p>
        ) : null}
      </header>

      <div className="mt-6 space-y-8">
        <section>
          <p className="type-micro text-cited-ink-faint">Prompt</p>
          <p className="mt-2 type-body text-cited-ink">
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

      <p className="mt-10 type-meta text-cited-ink-faint">
        Evidence is preserved even when archived or resolved.{" "}
        <Link href={backHref} className="underline-offset-4 hover:underline">
          Return to Inbox
        </Link>
      </p>
    </article>
  );
}
