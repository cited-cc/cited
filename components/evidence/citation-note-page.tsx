"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AnnotationRail } from "@/components/evidence/annotation-rail";
import type { AnnotationComposerTarget } from "@/components/evidence/annotation-composer";
import { AllSourcesList } from "@/components/evidence/all-sources-list";
import { ChangeSummary } from "@/components/evidence/change-summary";
import { CitationNoteHeader } from "@/components/evidence/citation-note-header";
import { CitationNoteSummary } from "@/components/evidence/citation-note-summary";
import { EvidenceProvenanceNote } from "@/components/evidence/evidence-provenance-note";
import { EvidenceSourceList } from "@/components/evidence/evidence-source-list";
import {
  EvidenceTranscript,
  type EvidenceSelectionRange,
} from "@/components/evidence/evidence-transcript";
import { LinkedNotebookNotes } from "@/components/evidence/linked-notebook-notes";
import { MonitoredResponseCard } from "@/components/evidence/monitored-response-card";
import { OccurrenceLedger } from "@/components/evidence/occurrence-ledger";
import { OccurrenceSelector } from "@/components/evidence/occurrence-selector";
import { ScanInsightsCard } from "@/components/evidence/scan-insights-card";
import { ExportActions } from "@/components/export/export-actions";
import { TerminologyPopover } from "@/components/guidance/help";
import { Button } from "@/components/ui/button";
import type { CitationEventDetail } from "@/lib/evidence/types";
import type { InboxMemberState } from "@/lib/inbox/types";

type CitationNotePageProps = {
  detail: CitationEventDetail;
  backHref: string;
  selectedOccurrenceId: string;
  canExport?: boolean;
};

export function CitationNotePage({
  detail,
  backHref,
  selectedOccurrenceId,
  canExport = false,
}: CitationNotePageProps) {
  const router = useRouter();
  const [memberState, setMemberState] = useState<InboxMemberState>(
    detail.event.memberState,
  );
  const [composerTarget, setComposerTarget] =
    useState<AnnotationComposerTarget | null>(null);

  function handleAnnotateSelection(selection: EvidenceSelectionRange) {
    if (!detail.permissions.canAnnotate) return;
    setComposerTarget({
      kind: "response",
      aiResponseId: detail.response.id,
      anchorStart: selection.start,
      anchorEnd: selection.end,
      selectedText: selection.selectedText,
      contextBefore: selection.contextBefore,
      contextAfter: selection.contextAfter,
    });
  }

  function handleCreateNote() {
    router.push(`/app/notebook?create=1&event=${detail.event.id}`);
  }

  const primaryColumn = (
    <div className="space-y-8">
      {!detail.historyAccess.allowed ? (
        <div
          className="rounded-md border border-cited-warning/25 bg-cited-warning-muted px-4 py-3 text-cited-warning"
          role="status"
        >
          <p className="mb-1 font-mono text-[11px] font-medium tracking-[0.08em] uppercase">
            History window
          </p>
          <p className="text-sm">
            {detail.historyAccess.safeMessage ??
              "This citation note is outside your current history window."}
          </p>
        </div>
      ) : null}

      <CitationNoteHeader
        detail={{ ...detail, event: { ...detail.event, memberState } }}
        memberState={memberState}
        onStateChange={setMemberState}
        onAddAnnotation={() => setComposerTarget({ kind: "event" })}
        onCreateNote={
          detail.permissions.canCreateNote ? handleCreateNote : undefined
        }
      />

      <CitationNoteSummary
        detail={{ ...detail, event: { ...detail.event, memberState } }}
      />

      <div className="flex flex-wrap items-center gap-3">
        <TerminologyPopover term={detail.event.eventType} />
        {canExport ? (
          <ExportActions
            canExport={canExport}
            eventId={detail.event.id}
            variants={["note-md"]}
          />
        ) : null}
      </div>

      <OccurrenceSelector
        eventId={detail.event.id}
        occurrences={detail.occurrences}
        selectedOccurrenceId={selectedOccurrenceId}
        className="lg:hidden"
      />

      <ChangeSummary change={detail.changeSummary} />

      <section>
        <p className="type-micro text-cited-ink-faint">Evidence</p>
        <div className="mt-2">
          {detail.response.responseText ? (
            <EvidenceTranscript
              text={detail.response.responseText}
              highlights={detail.highlights}
              canAnnotate={detail.permissions.canAnnotate}
              onAnnotateSelection={handleAnnotateSelection}
            />
          ) : (
            <p className="type-body-sm text-cited-ink-muted">
              No response text was retained for this observation.
            </p>
          )}
        </div>
      </section>

      <EvidenceSourceList
        sources={detail.sources}
        canAnnotate={detail.permissions.canAnnotate}
        onAnnotate={(source) =>
          setComposerTarget({
            kind: "evidence",
            evidenceId: source.id,
            aiResponseId: detail.response.id,
            anchorText: source.text,
          })
        }
      />

      <AllSourcesList
        sources={detail.response.allSources}
        domainHostname={detail.event.domainHostname}
      />

      <ScanInsightsCard
        insight={detail.response.scanInsight}
        providerMetadata={detail.response.providerMetadata}
      />

      <MonitoredResponseCard response={detail.response} metadataOnly />

      <EvidenceProvenanceNote
        short={detail.provenance.short}
        detail={detail.provenance.detail}
      />

      <div className="lg:hidden">
        <OccurrenceLedger
          eventId={detail.event.id}
          occurrences={detail.occurrences}
          hasMore={detail.occurrenceHasMore}
          nextCursor={detail.occurrenceNextCursor}
        />
      </div>

      <div className="lg:hidden">
        <AnnotationRail
          eventId={detail.event.id}
          annotations={detail.annotations}
          canAnnotate={detail.permissions.canAnnotate}
          composerTarget={composerTarget}
          onComposerTargetChange={setComposerTarget}
        />
      </div>

      <div className="lg:hidden">
        <LinkedNotebookNotes
          eventId={detail.event.id}
          notes={detail.linkedNotes}
          canCreateNote={detail.permissions.canCreateNote}
        />
      </div>
    </div>
  );

  const rightRail = (
    <div className="space-y-8">
      <OccurrenceLedger
        eventId={detail.event.id}
        occurrences={detail.occurrences}
        hasMore={detail.occurrenceHasMore}
        nextCursor={detail.occurrenceNextCursor}
      />
      <AnnotationRail
        eventId={detail.event.id}
        annotations={detail.annotations}
        canAnnotate={detail.permissions.canAnnotate}
        composerTarget={composerTarget}
        onComposerTargetChange={setComposerTarget}
      />
      <LinkedNotebookNotes
        eventId={detail.event.id}
        notes={detail.linkedNotes}
        canCreateNote={detail.permissions.canCreateNote}
      />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <Button href={backHref} variant="ghost" size="sm">
          Back to Inbox
        </Button>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
        <div>{primaryColumn}</div>
        <div className="hidden lg:block">{rightRail}</div>
      </div>

      <p className="mt-10 type-meta text-cited-ink-faint">
        Evidence is preserved even when archived or resolved.
      </p>
    </div>
  );
}
