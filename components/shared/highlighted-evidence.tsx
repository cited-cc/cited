import type { ReactNode } from "react";

import {
  formatProviderText,
  normalizeProviderText,
} from "@/lib/evidence/provider-text";
import { renderHighlightedSegment } from "@/lib/evidence/render-evidence-text";
import { cn } from "@/lib/utils";

export type EvidenceMatchType =
  | "citation"
  | "brand"
  | "recommendation"
  | "competitor"
  | "missed_opportunity";

export type EvidenceMatch = {
  start: number;
  end: number;
  type: EvidenceMatchType;
};

type HighlightedEvidenceProps = {
  text: string;
  matches?: EvidenceMatch[];
  className?: string;
};

function sanitizeMatches(matches: EvidenceMatch[], length: number) {
  return matches
    .filter((m) => m.start >= 0 && m.end > m.start && m.start < length)
    .map((m) => ({ ...m, end: Math.min(m.end, length) }))
    .sort((a, b) => a.start - b.start);
}

function excerptNodes(
  text: string,
  matches: EvidenceMatch[],
  explainIdPrefix: string,
): ReactNode {
  const formatted = formatProviderText(text);
  const displayText = formatted.text || normalizeProviderText(text);
  const safe = sanitizeMatches(matches, displayText.length);
  const highlightSpans = safe.map((match) => ({
    start: match.start,
    end: match.end,
    kind: match.type,
    label: match.type.replace(/_/g, " "),
  }));

  if (highlightSpans.length === 0) {
    return displayText;
  }

  return renderHighlightedSegment(
    displayText,
    highlightSpans,
    explainIdPrefix,
  );
}

export function HighlightedEvidence({
  text,
  matches = [],
  className,
}: HighlightedEvidenceProps) {
  const formatted = formatProviderText(text);
  const displayText = formatted.text || normalizeProviderText(text);

  if (!displayText) {
    return null;
  }

  return (
    <p className={cn("type-body text-cited-ink", className)}>
      {excerptNodes(text, matches, "excerpt")}
    </p>
  );
}
