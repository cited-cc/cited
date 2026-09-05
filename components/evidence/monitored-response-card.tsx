"use client";

import { useState } from "react";

import { SURFACE_LABELS } from "@/components/shared/ai-surface-badge";
import { Button } from "@/components/ui/button";
import { FormattedEvidenceBody } from "@/lib/evidence/render-evidence-text";
import {
  RESPONSE_COLLAPSE_THRESHOLD,
  type MonitoredResponseSnapshot,
} from "@/lib/evidence/types";
import {
  formatAbsoluteUtc,
  formatRelativeUtc,
} from "@/lib/inbox/serializers";
import { cn } from "@/lib/utils";

type MonitoredResponseCardProps = {
  response: MonitoredResponseSnapshot;
  className?: string;
  /** Hide duplicate response body when the page already shows EvidenceTranscript. */
  metadataOnly?: boolean;
};

function formatCost(value: number | null | undefined): string | null {
  if (typeof value !== "number" || value <= 0) return null;
  return `$${value.toFixed(4)}`;
}

export function MonitoredResponseCard({
  response,
  className,
  metadataOnly = false,
}: MonitoredResponseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const text = response.responseText;
  const isLong = Boolean(text && text.length > RESPONSE_COLLAPSE_THRESHOLD);
  const displayText =
    text && isLong && !expanded
      ? `${text.slice(0, RESPONSE_COLLAPSE_THRESHOLD).trimEnd()}…`
      : text;
  const surface = response.aiSurface
    ? SURFACE_LABELS[response.aiSurface]
    : null;
  const metadata = response.providerMetadata;
  const cost =
    formatCost(response.scanInsight?.providerCostUsd) ??
    formatCost(metadata?.providerCostUsd ?? metadata?.moneySpent);

  return (
    <section
      className={cn(
        "rounded-md border border-cited-line-subtle bg-cited-surface px-3 py-3",
        className,
      )}
      aria-label="Monitored response"
    >
      <p className="type-micro text-cited-ink-faint">Monitored response</p>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="type-micro text-cited-ink-faint">Surface</dt>
          <dd className="mt-1 font-mono text-xs text-cited-ink">
            {surface ?? "Unknown"}
          </dd>
        </div>
        <div>
          <dt className="type-micro text-cited-ink-faint">Observed</dt>
          <dd className="mt-1 font-mono text-xs text-cited-ink">
            <time
              dateTime={response.observedAt}
              title={formatAbsoluteUtc(response.observedAt)}
            >
              {formatRelativeUtc(response.observedAt)}
            </time>
          </dd>
        </div>
        {response.locationLabel ? (
          <div>
            <dt className="type-micro text-cited-ink-faint">Location</dt>
            <dd className="mt-1 font-mono text-xs text-cited-ink">
              {response.locationLabel}
              {response.locationSource
                ? ` · ${response.locationSource}`
                : null}
            </dd>
          </div>
        ) : null}
        {response.modelName ? (
          <div>
            <dt className="type-micro text-cited-ink-faint">Model</dt>
            <dd className="mt-1 font-mono text-xs text-cited-ink">
              {response.modelName}
            </dd>
          </div>
        ) : null}
        {response.allSources.length > 0 ? (
          <div>
            <dt className="type-micro text-cited-ink-faint">Sources in answer</dt>
            <dd className="mt-1 font-mono text-xs text-cited-ink">
              {response.allSources.length}
            </dd>
          </div>
        ) : null}
        {cost ? (
          <div>
            <dt className="type-micro text-cited-ink-faint">Provider cost</dt>
            <dd className="mt-1 font-mono text-xs text-cited-ink">{cost}</dd>
          </div>
        ) : null}
        {metadata?.webSearch === true ? (
          <div>
            <dt className="type-micro text-cited-ink-faint">Web search</dt>
            <dd className="mt-1 font-mono text-xs text-cited-ink">Used</dd>
          </div>
        ) : null}
      </dl>

      {response.promptText ? (
        <div className="mt-4">
          <p className="type-micro text-cited-ink-faint">Prompt</p>
          <p className="mt-1.5 type-body-sm whitespace-pre-wrap text-cited-ink">
            {response.promptText}
          </p>
        </div>
      ) : null}

      {!metadataOnly ? (
        <div className="mt-4">
          <p className="type-micro text-cited-ink-faint">Response</p>
          {!response.responseRetained || !displayText ? (
            <p className="mt-1.5 type-body-sm text-cited-ink-muted">
              Full response text was not retained for this observation.
            </p>
          ) : (
            <>
              <div className="mt-1.5">
                <FormattedEvidenceBody
                  text={displayText}
                  explainIdPrefix="monitored-response"
                />
              </div>
              {isLong ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={expanded}
                >
                  {expanded
                    ? "Collapse monitored response"
                    : "Show full monitored response"}
                </Button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
