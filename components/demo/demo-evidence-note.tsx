"use client";

import { AiSurfaceBadge } from "@/components/shared/ai-surface-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import {
  demoEventTypeLabel,
  type DemoEvent,
} from "@/lib/demo/demo-events";
import type { DemoAnnotation } from "@/lib/demo/demo-notes";

type DemoEvidenceNoteProps = {
  event: DemoEvent;
  saved: boolean;
  onToggleSaved: () => void;
  annotations: readonly DemoAnnotation[];
};

export function DemoEvidenceNote({
  event,
  saved,
  onToggleSaved,
  annotations,
}: DemoEvidenceNoteProps) {
  return (
    <Card className="bg-cited-surface" data-testid="demo-evidence-note">
      <CardBody className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="type-micro mb-2">Evidence note</p>
            <h2 className="type-title text-[1.15rem]">{event.title}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="neutral">
                {demoEventTypeLabel(event.eventType)}
              </Badge>
              <AiSurfaceBadge surface={event.surface} />
              <Badge variant="warning">Fictional</Badge>
            </div>
          </div>
          <Button
            variant={saved ? "secondary" : "primary"}
            size="sm"
            type="button"
            onClick={onToggleSaved}
          >
            {saved ? "Saved" : "Save note"}
          </Button>
        </div>

        <div>
          <p className="type-micro mb-1.5">Prompt</p>
          <p className="type-body-sm text-cited-ink">{event.prompt}</p>
        </div>

        <div className="rounded-md border border-cited-citation/20 bg-cited-citation-muted/20 px-3 py-3">
          <p className="type-micro mb-1.5 text-cited-citation">Response excerpt</p>
          <p className="type-body-sm text-cited-ink-muted">{event.excerpt}</p>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="type-meta">Source</dt>
            <dd className="type-body-sm">
              {event.sourceHostname
                ? `${event.sourceHostname}${event.sourcePath ?? ""}`
                : "No attributable source link"}
            </dd>
          </div>
          <div>
            <dt className="type-meta">Confidence</dt>
            <dd className="type-body-sm capitalize">{event.confidenceLabel}</dd>
          </div>
          <div>
            <dt className="type-meta">First seen</dt>
            <dd className="type-body-sm">{event.firstSeenLabel}</dd>
          </div>
          <div>
            <dt className="type-meta">Last seen</dt>
            <dd className="type-body-sm">{event.lastSeenLabel}</dd>
          </div>
          <div>
            <dt className="type-meta">Occurrences</dt>
            <dd className="type-body-sm">{event.occurrenceCount}</dd>
          </div>
        </dl>

        <div>
          <p className="type-micro mb-3">Annotations (preview)</p>
          <ul className="space-y-3">
            {annotations.map((annotation) => (
              <li
                key={annotation.id}
                className="rounded-md border border-cited-line-subtle bg-cited-canvas-elevated px-3 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="type-meta">{annotation.authorLabel}</span>
                  <Badge variant={annotation.resolved ? "neutral" : "success"}>
                    {annotation.resolved ? "Resolved" : "Open"}
                  </Badge>
                </div>
                <p className="mt-2 type-body-sm text-cited-ink-muted">
                  {annotation.body}
                </p>
                <p className="mt-2 type-meta text-cited-ink-faint">
                  {annotation.createdAtLabel}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </CardBody>
    </Card>
  );
}
