import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type NoteCardVariant =
  | "default"
  | "citation"
  | "mention"
  | "opportunity"
  | "competitor"
  | "saved"
  | "warning";

const VARIANT_ACCENT: Record<NoteCardVariant, string> = {
  default: "border-l-cited-line-strong",
  citation: "border-l-cited-accent-bright",
  mention: "border-l-cited-accent-bright",
  opportunity: "border-l-cited-accent-bright",
  competitor: "border-l-cited-accent-bright",
  saved: "border-l-cited-accent-bright",
  warning: "border-l-cited-accent-bright",
};

const VARIANT_BADGE: Partial<Record<NoteCardVariant, BadgeVariant>> = {
  citation: "citation",
  mention: "mention",
  opportunity: "missed_opportunity",
  competitor: "competitor",
  saved: "success",
  warning: "warning",
};

function indexLabelVariant(label: string): BadgeVariant {
  switch (label.toUpperCase()) {
    case "NEW":
      return "new";
    case "WATCH":
      return "warning";
    case "MISSED":
      return "danger";
    default:
      return "default";
  }
}

type NoteCardProps = {
  variant?: NoteCardVariant;
  indexLabel?: string;
  badge?: string;
  meta?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  example?: boolean;
  selected?: boolean;
};

export function NoteCard({
  variant = "default",
  indexLabel,
  badge,
  meta,
  title,
  children,
  footer,
  className,
  example = false,
  selected = false,
}: NoteCardProps) {
  return (
    <article
      className={cn(
        "motion-rise rounded-md border border-cited-line border-l-2 bg-cited-paper cited-note-shadow hover:border-cited-line-strong",
        VARIANT_ACCENT[variant],
        selected &&
          "border-cited-accent/45 bg-cited-accent-muted/25 ring-1 ring-cited-accent/35",
        className,
      )}
      aria-label={example ? `Example note: ${title}` : title}
      aria-current={selected ? "true" : undefined}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {indexLabel ? (
            <Badge variant={indexLabelVariant(indexLabel)}>{indexLabel}</Badge>
          ) : null}
          {badge ? (
            <Badge variant={VARIANT_BADGE[variant] ?? "default"}>{badge}</Badge>
          ) : null}
          {example ? <Badge variant="neutral">Example</Badge> : null}
        </div>
        {meta ? <div className="shrink-0 type-meta">{meta}</div> : null}
      </div>
      <div className="px-4 py-3">
        <h3 className="type-title text-cited-ink-strong">{title}</h3>
        {children ? <div className="mt-2 space-y-2">{children}</div> : null}
      </div>
      {footer ? (
        <div className="flex items-center justify-between gap-3 border-t border-cited-line-subtle px-4 py-2.5">
          {footer}
        </div>
      ) : null}
    </article>
  );
}
