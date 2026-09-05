import { cn } from "@/lib/utils";

type InsetPanelProps = {
  children: React.ReactNode;
  className?: string;
  mono?: boolean;
  label?: string;
};

export function InsetPanel({
  children,
  className,
  mono = false,
  label,
}: InsetPanelProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-cited-line-subtle bg-cited-paper px-3 py-2.5 shadow-[inset_0_1px_0_rgba(244,239,224,0.04)]",
        mono && "font-mono text-[13px] leading-relaxed tracking-[0.01em] text-cited-ink-muted",
        className,
      )}
    >
      {label ? <p className="mb-1.5 type-micro">{label}</p> : null}
      {children}
    </div>
  );
}

type DividerProps = {
  className?: string;
  label?: string;
};

export function Divider({ className, label }: DividerProps) {
  if (!label) {
    return (
      <hr
        className={cn("border-0 border-t border-cited-line-subtle", className)}
      />
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)} role="separator">
      <div className="h-px flex-1 bg-cited-line-subtle" />
      <span className="type-micro shrink-0">{label}</span>
      <div className="h-px flex-1 bg-cited-line-subtle" />
    </div>
  );
}

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? <p className="mb-1.5 type-micro">{eyebrow}</p> : null}
        <h2 className="type-heading">{title}</h2>
        {description ? (
          <p className="mt-1.5 max-w-2xl type-body">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
