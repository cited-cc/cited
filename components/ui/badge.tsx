import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "new"
  | "citation"
  | "mention"
  | "recommendation"
  | "missed_opportunity"
  | "competitor"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default:
    "border-cited-line-subtle bg-cited-surface-raised text-cited-ink-muted",
  new: "border-cited-accent/30 bg-cited-accent-muted text-cited-accent",
  citation:
    "border-cited-accent/30 bg-cited-accent-muted text-cited-accent",
  mention: "border-cited-accent/30 bg-cited-accent-muted text-cited-accent",
  recommendation:
    "border-cited-accent/30 bg-cited-accent-muted text-cited-accent",
  missed_opportunity:
    "border-cited-accent/30 bg-cited-accent-muted text-cited-accent",
  competitor:
    "border-cited-accent/30 bg-cited-accent-muted text-cited-accent",
  success: "border-cited-accent/30 bg-cited-accent-muted text-cited-accent",
  warning: "border-cited-accent/30 bg-cited-accent-muted text-cited-accent",
  danger: "border-cited-danger/25 bg-cited-danger-muted text-cited-danger",
  neutral: "border-cited-line-subtle bg-transparent text-cited-ink-subtle",
};

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--cited-radius-xs)] border px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-[0.16em] uppercase",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SignalBadge(props: BadgeProps) {
  return <Badge {...props} />;
}
