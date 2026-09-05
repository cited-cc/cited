import { cn } from "@/lib/utils";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
  interactive?: boolean;
  id?: string;
};

export function Card({
  children,
  className,
  as: Comp = "div",
  interactive = false,
  id,
}: CardProps) {
  return (
    <Comp
      id={id}
      className={cn(
        "rounded-md border border-cited-line bg-cited-surface cited-note-shadow",
        interactive && "motion-rise hover:border-cited-line-strong hover:bg-cited-surface-raised",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

type CardHeaderProps = {
  children: React.ReactNode;
  className?: string;
};

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("border-b border-cited-line-subtle px-4 py-3", className)}>
      {children}
    </div>
  );
}

type CardBodyProps = {
  children: React.ReactNode;
  className?: string;
};

export function CardBody({ children, className }: CardBodyProps) {
  return <div className={cn("px-4 py-4", className)}>{children}</div>;
}

type CardFooterProps = {
  children: React.ReactNode;
  className?: string;
};

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-t border-cited-line-subtle px-4 py-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
