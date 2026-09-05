"use client";

import { useId, useState } from "react";
import { ExternalLink } from "lucide-react";

import { AiSurfaceBadge } from "@/components/shared/ai-surface-badge";
import { EventStateMarker } from "@/components/shared/event-state-marker";
import { HighlightedEvidence } from "@/components/shared/highlighted-evidence";
import { PromptReference } from "@/components/shared/prompt-reference";
import { Badge } from "@/components/ui/badge";
import { NoteCard } from "@/components/ui/note-card";
import { ProductPreviewFrame } from "@/components/marketing/marketing-primitives";
import {
  EXAMPLE_INBOX_NOTES,
  INBOX_SECTION,
  type ExampleInboxNote,
} from "@/lib/content/marketing";
import { cn } from "@/lib/utils";

type InboxPreviewProps = {
  className?: string;
};

function highlightMatches(
  excerpt: string,
  phrase: string,
  variant: ExampleInboxNote["variant"],
) {
  const start = excerpt.indexOf(phrase);
  if (start < 0) return [];

  const type =
    variant === "opportunity"
      ? ("competitor" as const)
      : variant === "mention"
        ? ("brand" as const)
        : ("citation" as const);

  return [
    {
      start,
      end: start + phrase.length,
      type,
    },
  ];
}

function EvidenceRail({
  note,
  panelId,
}: {
  note: ExampleInboxNote;
  panelId: string;
}) {
  const citedUrl = note.citedUrl;
  const sourceLabel = note.sourceTitle ?? note.domain;
  const sourcePathLabel = `${note.domain}${note.sourcePath ?? ""}`;

  return (
    <aside
      id={panelId}
      className="flex h-full min-h-0 flex-col rounded-md border border-cited-line-subtle bg-cited-canvas-elevated"
      aria-label="Source evidence"
      aria-live="polite"
    >
      <div className="border-b border-cited-line-subtle px-4 py-3">
        <p className="type-micro text-cited-ink-faint">Source evidence</p>
        <p className="mt-2 type-title text-[0.95rem] text-cited-ink-strong">
          {note.title}
        </p>
        <p className="mt-2 type-body-sm text-cited-ink-muted">
          Prompt, response excerpt, attributable source, and first-seen history
          for this illustrative note.
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <section>
          <p className="type-micro text-cited-ink-faint">Prompt</p>
          <p className="mt-2 type-body-sm text-cited-ink">{note.prompt}</p>
        </section>

        <section>
          <p className="type-micro text-cited-ink-faint">Evidence</p>
          <div className="mt-2 rounded-md border border-cited-citation/20 bg-cited-citation-muted/20 px-3 py-3">
            <HighlightedEvidence
              text={note.excerpt}
              matches={highlightMatches(
                note.excerpt,
                note.highlightPhrase,
                note.variant,
              )}
              className="type-body-sm"
            />
          </div>
          <p className="mt-2 font-mono text-[11px] text-cited-ink-subtle">
            Match confidence: {note.confidenceLabel}
          </p>
        </section>

        <section>
          <div className="rounded-md border border-cited-line-subtle bg-cited-surface px-3 py-3">
            <p className="type-micro text-cited-ink-faint">Source</p>
            {citedUrl ? (
              <>
                <a
                  href={citedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex max-w-full items-center gap-1.5 text-cited-ink transition hover:text-cited-citation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent/50"
                >
                  <span className="min-w-0 truncate font-mono text-xs">
                    {sourceLabel}
                  </span>
                  <ExternalLink
                    className="h-3 w-3 shrink-0 text-cited-ink-faint"
                    aria-hidden
                  />
                  <span className="sr-only">(opens in new tab)</span>
                </a>
                <p className="mt-1 truncate font-mono text-[11px] text-cited-ink-faint">
                  {sourcePathLabel}
                </p>
              </>
            ) : null}
            <p className="mt-2 type-body-sm text-cited-ink-muted">
              {note.sourceDetail}
            </p>
          </div>
        </section>

        <dl className="space-y-2 border-t border-cited-line-subtle pt-4">
          <div className="flex justify-between gap-2">
            <dt className="type-meta">Event</dt>
            <dd className="type-meta text-cited-ink-muted">{note.eventLabel}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="type-meta">Surface</dt>
            <dd className="type-meta text-cited-ink-muted">{note.surfaceLabel}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="type-meta">Domain</dt>
            <dd className="type-meta text-cited-ink-muted">{note.domain}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="type-meta">First seen</dt>
            <dd className="type-meta text-cited-ink-muted">{note.firstSeen}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="type-meta">Occurrences</dt>
            <dd className="type-meta text-cited-ink-muted">
              {note.occurrenceCount}
            </dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}

export function InboxPreview({ className }: InboxPreviewProps) {
  const panelId = useId();
  const [selectedId, setSelectedId] = useState<ExampleInboxNote["id"]>(
    EXAMPLE_INBOX_NOTES[0]!.id,
  );
  const selected =
    EXAMPLE_INBOX_NOTES.find((note) => note.id === selectedId) ??
    EXAMPLE_INBOX_NOTES[0]!;

  return (
    <ProductPreviewFrame
      label={INBOX_SECTION.previewLabel}
      className={cn(className)}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="neutral">Illustrative workspace preview</Badge>
        <span className="type-meta">Sample citation notes</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-3" role="list" aria-label="Sample citation notes">
          {EXAMPLE_INBOX_NOTES.map((note) => {
            const isSelected = note.id === selected.id;

            return (
              <div key={note.id} role="listitem">
                <div
                  role="button"
                  tabIndex={0}
                  aria-controls={panelId}
                  aria-current={isSelected ? "true" : undefined}
                  aria-label={`Open evidence for ${note.title}`}
                  onClick={() => setSelectedId(note.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedId(note.id);
                    }
                  }}
                  className="cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent/50"
                >
                  <NoteCard
                    example
                    selected={isSelected}
                    variant={note.variant}
                    indexLabel={note.state}
                    badge={note.kind}
                    title={note.title}
                    meta={note.meta}
                    footer={
                      <div className="flex w-full items-center justify-between gap-2">
                        <AiSurfaceBadge surface={note.surface} />
                        <EventStateMarker state={note.memberState} />
                      </div>
                    }
                  >
                    <PromptReference prompt={note.prompt} truncated />
                    <p className="type-meta text-cited-ink-subtle">
                      {note.source}
                    </p>
                  </NoteCard>
                </div>
              </div>
            );
          })}
        </div>
        <div
          key={selected.id}
          className="motion-safe:animate-[cited-evidence-in_280ms_var(--cited-ease)]"
        >
          <EvidenceRail note={selected} panelId={panelId} />
        </div>
      </div>
    </ProductPreviewFrame>
  );
}
