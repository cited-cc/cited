import { cn } from "@/lib/utils";

type EvidenceProvenanceNoteProps = {
  short: string;
  detail: string;
  className?: string;
};

export function EvidenceProvenanceNote({
  short,
  detail,
  className,
}: EvidenceProvenanceNoteProps) {
  return (
    <aside
      className={cn(
        "border-l border-cited-line-subtle pl-3",
        className,
      )}
      aria-label="Evidence provenance"
    >
      <p className="type-body-sm text-cited-ink-subtle">{short}</p>
      <p className="mt-1.5 type-meta text-cited-ink-faint">{detail}</p>
    </aside>
  );
}
