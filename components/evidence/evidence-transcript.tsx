"use client";

import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { AnnotationSelectionToolbar } from "@/components/evidence/annotation-selection-toolbar";
import { formatProviderText } from "@/lib/evidence/provider-text";
import { FormattedEvidenceBody } from "@/lib/evidence/render-evidence-text";
import type { EvidenceHighlightSpan } from "@/lib/evidence/types";
import { cn } from "@/lib/utils";

export type EvidenceSelectionRange = {
  start: number;
  end: number;
  selectedText: string;
  contextBefore: string;
  contextAfter: string;
};

type EvidenceTranscriptProps = {
  text: string;
  highlights?: EvidenceHighlightSpan[];
  onAnnotateSelection?: (selection: EvidenceSelectionRange) => void;
  canAnnotate?: boolean;
  className?: string;
};

function offsetWithinContainer(
  container: HTMLElement,
  node: Node,
  offset: number,
): number | null {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let total = 0;
  let current = walker.nextNode();
  while (current) {
    const length = current.textContent?.length ?? 0;
    if (current === node) {
      return total + Math.min(offset, length);
    }
    total += length;
    current = walker.nextNode();
  }
  return null;
}

export function EvidenceTranscript({
  text,
  highlights = [],
  onAnnotateSelection,
  canAnnotate = false,
  className,
}: EvidenceTranscriptProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const explainPrefix = useId();
  const normalizedText = useMemo(
    () => formatProviderText(text).text,
    [text],
  );
  const [toolbar, setToolbar] = useState<{
    top: number;
    left: number;
    selection: EvidenceSelectionRange;
  } | null>(null);

  const clearToolbar = useCallback(() => setToolbar(null), []);

  const handleMouseUp = useCallback(() => {
    if (!canAnnotate || !onAnnotateSelection || !containerRef.current) {
      clearToolbar();
      return;
    }

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      clearToolbar();
      return;
    }

    const range = sel.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      clearToolbar();
      return;
    }

    const start = offsetWithinContainer(
      containerRef.current,
      range.startContainer,
      range.startOffset,
    );
    const end = offsetWithinContainer(
      containerRef.current,
      range.endContainer,
      range.endOffset,
    );
    if (start == null || end == null || end <= start) {
      clearToolbar();
      return;
    }

    const selectedText = normalizedText.slice(start, end);
    if (!selectedText.trim()) {
      clearToolbar();
      return;
    }

    const contextBefore = normalizedText.slice(
      Math.max(0, start - 80),
      start,
    );
    const contextAfter = normalizedText.slice(
      end,
      Math.min(normalizedText.length, end + 80),
    );
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    setToolbar({
      top: rect.top - containerRect.top - 40,
      left: Math.max(
        0,
        Math.min(
          rect.left - containerRect.left + rect.width / 2 - 60,
          containerRect.width - 140,
        ),
      ),
      selection: {
        start,
        end,
        selectedText,
        contextBefore,
        contextAfter,
      },
    });
  }, [canAnnotate, clearToolbar, normalizedText, onAnnotateSelection]);

  if (!normalizedText) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      <div
        ref={containerRef}
        role="region"
        aria-label="Evidence transcript"
        className="select-text"
        onMouseUp={handleMouseUp}
        onKeyUp={handleMouseUp}
      >
        <FormattedEvidenceBody
          text={text}
          highlights={highlights}
          explainIdPrefix={explainPrefix}
        />
      </div>

      {toolbar && canAnnotate && onAnnotateSelection ? (
        <AnnotationSelectionToolbar
          top={toolbar.top}
          left={toolbar.left}
          onAnnotate={() => {
            onAnnotateSelection(toolbar.selection);
            clearToolbar();
            window.getSelection()?.removeAllRanges();
          }}
        />
      ) : null}
    </div>
  );
}
