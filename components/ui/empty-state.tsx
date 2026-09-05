import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start rounded-md border border-dashed border-cited-line bg-cited-surface/60 px-6 py-10",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 text-cited-ink-subtle" aria-hidden>
          {icon}
        </div>
      ) : null}
      <h2 className="type-title text-cited-ink-strong">{title}</h2>
      <p className="mt-2 max-w-lg type-body">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
      {children ? <div className="mt-6 w-full">{children}</div> : null}
    </div>
  );
}
