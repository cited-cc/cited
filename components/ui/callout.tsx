import { cn } from "@/lib/utils";

type CalloutTone = "info" | "warning" | "danger" | "citation" | "accent";

const TONE_CLASSES: Record<CalloutTone, string> = {
  info: "border-cited-accent/30 bg-cited-accent-muted text-cited-accent",
  warning: "border-cited-accent/30 bg-cited-accent-muted text-cited-accent",
  danger: "border-cited-danger/25 bg-cited-danger-muted text-cited-danger",
  citation:
    "border-cited-accent/30 bg-cited-accent-muted text-cited-accent",
  accent: "border-cited-accent/30 bg-cited-accent-muted text-cited-accent",
};

type CalloutProps = {
  title?: string;
  children: React.ReactNode;
  tone?: CalloutTone;
  className?: string;
};

export function Callout({
  title,
  children,
  tone = "info",
  className,
}: CalloutProps) {
  return (
    <aside
      className={cn(
        "rounded-[var(--cited-radius-md)] border px-4 py-3",
        TONE_CLASSES[tone],
        className,
      )}
      role="note"
    >
      {title ? (
        <p className="mb-1 font-mono text-[11px] font-medium tracking-[0.16em] uppercase">
          {title}
        </p>
      ) : null}
      <div className="text-[length:var(--text-body-sm)] leading-relaxed text-cited-ink">
        {children}
      </div>
    </aside>
  );
}
