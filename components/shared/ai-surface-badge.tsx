import type { AiSurfaceKey } from "@/types/product";
import { cn } from "@/lib/utils";

const SURFACE_LABELS: Record<AiSurfaceKey, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  google_ai_overviews: "Google AI Overviews",
  google_ai_mode: "Google AI Mode",
  perplexity: "Perplexity",
  claude: "Claude",
};

const SURFACE_MARKS: Record<AiSurfaceKey, string> = {
  chatgpt: "CG",
  gemini: "GM",
  google_ai_overviews: "AO",
  google_ai_mode: "AM",
  perplexity: "PX",
  claude: "CL",
};

type AiSurfaceBadgeProps = {
  surface: AiSurfaceKey;
  className?: string;
  showMark?: boolean;
};

export function AiSurfaceBadge({
  surface,
  className,
  showMark = true,
}: AiSurfaceBadgeProps) {
  const label = SURFACE_LABELS[surface];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-cited-line-subtle bg-cited-surface-raised px-1.5 py-0.5 font-mono text-[11px] tracking-[0.04em] text-cited-ink-muted",
        className,
      )}
      aria-label={`AI surface: ${label}`}
    >
      {showMark ? (
        <span className="text-cited-ink-faint" aria-hidden>
          {SURFACE_MARKS[surface]}
        </span>
      ) : null}
      <span>{label}</span>
    </span>
  );
}

export { SURFACE_LABELS };
