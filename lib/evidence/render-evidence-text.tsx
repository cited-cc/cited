import type { ReactNode } from "react";

import type { EvidenceHighlightSpan } from "@/lib/evidence/types";
import {
  formatProviderText,
  type EvidenceTextBlock,
  type EvidenceTextLine,
} from "@/lib/evidence/provider-text";
import { cn } from "@/lib/utils";

const HIGHLIGHT_STYLES: Record<EvidenceHighlightSpan["kind"], string> = {
  citation:
    "bg-cited-accent-muted text-cited-accent-ink rounded-sm px-0.5",
  brand: "bg-cited-accent-muted text-cited-accent-ink rounded-sm px-0.5",
  recommendation:
    "bg-cited-accent-muted text-cited-ink rounded-sm px-0.5 underline decoration-cited-accent/50 underline-offset-2",
  competitor: "bg-cited-accent-muted text-cited-accent-ink rounded-sm px-0.5",
  missed_opportunity:
    "bg-cited-accent-muted text-cited-accent-ink rounded-sm px-0.5",
};

function sanitizeHighlights(
  highlights: EvidenceHighlightSpan[],
  length: number,
): EvidenceHighlightSpan[] {
  return highlights
    .filter((h) => h.start >= 0 && h.end > h.start && h.start < length)
    .map((h) => ({ ...h, end: Math.min(h.end, length) }))
    .sort((a, b) => a.start - b.start);
}

export function renderHighlightedSegment(
  text: string,
  highlights: EvidenceHighlightSpan[],
  explainIdPrefix: string,
  startOffset = 0,
): ReactNode[] {
  const localHighlights = highlights
    .filter((h) => h.end > startOffset && h.start < startOffset + text.length)
    .map((h) => ({
      ...h,
      start: Math.max(0, h.start - startOffset),
      end: Math.min(text.length, h.end - startOffset),
    }));

  const safe = sanitizeHighlights(localHighlights, text.length);
  if (safe.length === 0) {
    return [text];
  }

  const nodes: ReactNode[] = [];
  let cursor = 0;

  safe.forEach((match, i) => {
    if (match.start < cursor) return;
    if (match.start > cursor) {
      nodes.push(
        <span key={`t-${explainIdPrefix}-${cursor}`}>
          {text.slice(cursor, match.start)}
        </span>,
      );
    }
    const explainId = `${explainIdPrefix}-${i}`;
    nodes.push(
      <mark
        key={`m-${explainIdPrefix}-${i}-${match.start}`}
        className={cn(HIGHLIGHT_STYLES[match.kind], "border-0")}
        aria-describedby={explainId}
      >
        {text.slice(match.start, match.end)}
        <span id={explainId} className="sr-only">
          {match.label}
        </span>
      </mark>,
    );
    cursor = match.end;
  });

  if (cursor < text.length) {
    nodes.push(
      <span key={`t-${explainIdPrefix}-${cursor}`}>
        {text.slice(cursor)}
      </span>,
    );
  }

  return nodes;
}

const HEADING_CLASSES: Record<2 | 3 | 4, string> = {
  2: "type-body-lg font-medium text-cited-ink",
  3: "type-body-md font-medium text-cited-ink",
  4: "type-body-sm font-medium text-cited-ink",
};

function renderListItem(
  item: EvidenceTextLine,
  highlights: EvidenceHighlightSpan[],
  explainIdPrefix: string,
) {
  return (
    <li
      key={`${explainIdPrefix}-${item.start}`}
      className="type-body text-cited-ink"
    >
      {renderHighlightedSegment(
        item.text,
        highlights,
        `${explainIdPrefix}-${item.start}`,
        item.start,
      )}
    </li>
  );
}

function renderBlock(
  block: EvidenceTextBlock,
  highlights: EvidenceHighlightSpan[],
  explainIdPrefix: string,
) {
  switch (block.kind) {
    case "heading":
      return (
        <h3
          key={`h-${block.start}`}
          className={cn(HEADING_CLASSES[block.level], "text-balance")}
        >
          {renderHighlightedSegment(
            block.text,
            highlights,
            `${explainIdPrefix}-h-${block.start}`,
            block.start,
          )}
        </h3>
      );
    case "paragraph":
      return (
        <p
          key={`p-${block.start}`}
          className="type-body whitespace-pre-wrap text-cited-ink"
        >
          {renderHighlightedSegment(
            block.text,
            highlights,
            `${explainIdPrefix}-p-${block.start}`,
            block.start,
          )}
        </p>
      );
    case "unordered-list":
      return (
        <ul
          key={`ul-${block.start}`}
          className="list-disc space-y-1.5 pl-5 type-body text-cited-ink marker:text-cited-ink-muted"
        >
          {block.items.map((item) =>
            renderListItem(item, highlights, `${explainIdPrefix}-ul-${block.start}`),
          )}
        </ul>
      );
    case "ordered-list":
      return (
        <ol
          key={`ol-${block.start}`}
          className="list-decimal space-y-1.5 pl-5 type-body text-cited-ink marker:text-cited-ink-muted"
        >
          {block.items.map((item) =>
            renderListItem(item, highlights, `${explainIdPrefix}-ol-${block.start}`),
          )}
        </ol>
      );
    default: {
      const exhaustive: never = block;
      return exhaustive;
    }
  }
}

type FormattedEvidenceBodyProps = {
  text: string;
  highlights?: EvidenceHighlightSpan[];
  className?: string;
  explainIdPrefix: string;
};

export function FormattedEvidenceBody({
  text,
  highlights = [],
  className,
  explainIdPrefix,
}: FormattedEvidenceBodyProps) {
  const formatted = formatProviderText(text);
  const displayText = formatted.text || text.trim();
  const blocks =
    formatted.blocks.length > 0
      ? formatted.blocks
      : displayText
        ? [
            {
              kind: "paragraph" as const,
              text: displayText,
              start: 0,
              end: displayText.length,
            },
          ]
        : [];

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {blocks.map((block) => renderBlock(block, highlights, explainIdPrefix))}
    </div>
  );
}
