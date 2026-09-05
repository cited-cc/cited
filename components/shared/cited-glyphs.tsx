import { cn } from "@/lib/utils";

type GlyphProps = {
  className?: string;
  size?: number;
};

export function CitationBracket({ className, size = 16 }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={cn("text-cited-citation", className)}
    >
      <path
        d="M5 2.5H3.75C2.78 2.5 2 3.28 2 4.25v7.5C2 12.72 2.78 13.5 3.75 13.5H5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M11 2.5h1.25c.97 0 1.75.78 1.75 1.75v7.5c0 .97-.78 1.75-1.75 1.75H11"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

type CitationIndexProps = {
  index: number | string;
  className?: string;
};

export function CitationIndex({ index, className }: CitationIndexProps) {
  const label =
    typeof index === "number" ? String(index).padStart(2, "0") : index;

  return (
    <span
      className={cn(
        "inline-flex font-mono text-[11px] font-medium tracking-[0.06em] text-cited-citation",
        className,
      )}
    >
      [{label}]
    </span>
  );
}

export function SourceSlip({ className, size = 20 }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={cn("text-cited-ink-muted", className)}
    >
      <rect
        x="3.5"
        y="2.5"
        width="13"
        height="15"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M12.5 2.5V6.5H16.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 9.5h7M6.5 12.5h5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EvidenceMarker({ className, size = 16 }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={cn("text-cited-citation", className)}
    >
      <path
        d="M3 3.5h10v9H3z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 6.5h5M5.5 9h3.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M11.5 11.5l1.5 1.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** @deprecated Prefer EvidenceMarker */
export function EvidenceMark(props: GlyphProps) {
  return <EvidenceMarker {...props} />;
}

export function FootnoteGlyph({ className, size = 16 }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={cn("text-cited-citation", className)}
    >
      <circle cx="8" cy="5.5" r="2" fill="currentColor" />
      <path
        d="M8 8.5v4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M6 12.5h4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function OccurrenceLedger({ className, size = 20 }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={cn("text-cited-ink-muted", className)}
    >
      <path
        d="M4 4.5h12M4 10h12M4 15.5h8"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <circle cx="16" cy="15.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function NotebookGlyph({ className, size = 20 }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={cn("text-cited-ink-muted", className)}
    >
      <rect
        x="4"
        y="2.5"
        width="12"
        height="15"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M7 2.5v15M9.5 6.5h4M9.5 9.5h4M9.5 12.5h2.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PromptGlyph({ className, size = 16 }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={cn("text-cited-ink-subtle", className)}
    >
      <path
        d="M3 4.5h10M3 8h7M3 11.5h5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <circle cx="12.5" cy="11.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function AlertSlip({ className, size = 20 }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={cn("text-cited-ink-muted", className)}
    >
      <rect
        x="3"
        y="4"
        width="14"
        height="12"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M3 7.5h14"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M6.5 11h4M6.5 13.5h7"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ScanPulse({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-2 w-2 items-center justify-center",
        className,
      )}
      aria-hidden
    >
      <span className="absolute inset-0 rounded-full bg-cited-accent/40 motion-safe:animate-ping" />
      <span className="relative h-1.5 w-1.5 rounded-full bg-cited-accent" />
    </span>
  );
}

export function CitationDeskGlyph({ className, size = 20 }: GlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={cn("text-cited-citation", className)}
    >
      <path
        d="M4 5.5h12v9H4z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M7 3.5h6"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M6.5 9h7M6.5 12h4"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}
