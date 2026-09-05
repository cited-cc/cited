"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { PromptGlyph } from "@/components/shared/cited-glyphs";
import { cn } from "@/lib/utils";

type PromptReferenceProps = {
  prompt: string;
  label?: string;
  truncated?: boolean;
  expandable?: boolean;
  showCopy?: boolean;
  className?: string;
};

export function PromptReference({
  prompt,
  label = "Prompt",
  truncated = false,
  expandable = false,
  showCopy = false,
  className,
}: PromptReferenceProps) {
  const [expanded, setExpanded] = useState(!truncated);
  const [copied, setCopied] = useState(false);

  const display =
    !expanded && truncated && prompt.length > 96
      ? `${prompt.slice(0, 96).trimEnd()}…`
      : prompt;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-md border border-cited-line-subtle bg-cited-canvas-elevated px-3 py-2.5",
        className,
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <PromptGlyph />
          <span className="type-micro">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          {expandable && truncated && prompt.length > 96 ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="type-meta rounded-sm px-1.5 py-0.5 text-cited-ink-subtle transition hover:text-cited-ink"
            >
              {expanded ? "Collapse" : "Expand"}
            </button>
          ) : null}
          {showCopy ? (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-cited-ink-subtle transition hover:text-cited-ink"
              aria-label={copied ? "Copied" : "Copy prompt"}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden />
              )}
            </button>
          ) : null}
        </div>
      </div>
      <p className="font-sans text-sm leading-relaxed text-cited-ink">
        <span className="text-cited-ink-faint" aria-hidden>
          “
        </span>
        {display}
        <span className="text-cited-ink-faint" aria-hidden>
          ”
        </span>
      </p>
    </div>
  );
}
