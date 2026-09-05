"use client";

type AnnotationSelectionToolbarProps = {
  top: number;
  left: number;
  onAnnotate: () => void;
};

export function AnnotationSelectionToolbar({
  top,
  left,
  onAnnotate,
}: AnnotationSelectionToolbarProps) {
  return (
    <div className="absolute z-20" style={{ top, left }}>
      <button
        type="button"
        className="rounded-sm border border-cited-line bg-cited-surface-raised px-2.5 py-1.5 font-mono text-[11px] tracking-[0.06em] uppercase text-cited-ink shadow-sm transition hover:border-cited-accent/40 hover:text-cited-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent/50"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onAnnotate}
      >
        Annotate
      </button>
    </div>
  );
}
