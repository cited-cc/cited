import { cn } from "@/lib/utils";

type CitationMarkerVariant = "numeric" | "label";

type CitationMarkerProps = {
  value: string | number;
  variant?: CitationMarkerVariant;
  tone?: "citation" | "muted" | "ink";
  className?: string;
};

export function CitationMarker({
  value,
  variant = "numeric",
  tone = "citation",
  className,
}: CitationMarkerProps) {
  const display =
    variant === "numeric" && typeof value === "number"
      ? `[${String(value).padStart(2, "0")}]`
      : variant === "numeric"
        ? `[${value}]`
        : String(value).toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex items-center font-mono text-[11px] font-medium tracking-[0.08em]",
        tone === "citation" && "text-cited-citation",
        tone === "muted" && "text-cited-ink-subtle",
        tone === "ink" && "text-cited-ink",
        className,
      )}
    >
      {display}
    </span>
  );
}
