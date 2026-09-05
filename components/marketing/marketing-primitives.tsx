import { cn } from "@/lib/utils";

type MarketingContainerProps = {
  children: React.ReactNode;
  className?: string;
  width?: "default" | "narrow" | "wide";
};

const WIDTHS = {
  narrow: "max-w-3xl",
  default: "max-w-5xl",
  wide: "max-w-[1240px]",
} as const;

export function MarketingContainer({
  children,
  className,
  width = "default",
}: MarketingContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full min-w-0 px-4 sm:px-6",
        WIDTHS[width],
        className,
      )}
    >
      {children}
    </div>
  );
}

type EyebrowProps = {
  children: React.ReactNode;
  className?: string;
};

export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <p className={cn("type-micro text-cited-citation", className)}>{children}</p>
  );
}

type MarketingSectionProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  /** DataFast scroll goal when this section becomes visible. */
  dataFastScroll?: string;
};

export function MarketingSection({
  children,
  className,
  id,
  dataFastScroll,
}: MarketingSectionProps) {
  return (
    <section
      id={id}
      className={cn("py-16 sm:py-24", className)}
      {...(dataFastScroll
        ? {
            "data-fast-scroll": dataFastScroll,
            "data-fast-scroll-threshold": "0.4",
          }
        : {})}
    >
      {children}
    </section>
  );
}

type FeatureFrameProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
};

export function FeatureFrame({
  children,
  className,
  title,
  description,
}: FeatureFrameProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-cited-line bg-cited-surface cited-note-shadow",
        className,
      )}
    >
      {(title || description) && (
        <div className="border-b border-cited-line-subtle px-5 py-4">
          {title ? <h3 className="type-title">{title}</h3> : null}
          {description ? (
            <p className="mt-1 type-body-sm">{description}</p>
          ) : null}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

type ProductPreviewFrameProps = {
  children: React.ReactNode;
  className?: string;
  label?: string;
};

export function ProductPreviewFrame({
  children,
  className,
  label = "Product preview",
}: ProductPreviewFrameProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-cited-line bg-cited-canvas-elevated text-cited-ink cited-overlay-shadow",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-cited-line-subtle px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-cited-ink-faint" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-cited-ink-faint" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-cited-ink-faint" aria-hidden />
        <span className="ml-2 type-micro">{label}</span>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

type QuoteBlockProps = {
  quote: string;
  attribution?: string;
  className?: string;
};

export function QuoteBlock({ quote, attribution, className }: QuoteBlockProps) {
  return (
    <blockquote
      className={cn(
        "border-l-2 border-cited-citation pl-5",
        className,
      )}
    >
      <p className="type-heading text-[1.25rem] text-cited-ink">{quote}</p>
      {attribution ? (
        <footer className="mt-3 type-meta">{attribution}</footer>
      ) : null}
    </blockquote>
  );
}

type InlineCtaProps = {
  title: string;
  description?: string;
  action: React.ReactNode;
  className?: string;
};

export function InlineCta({
  title,
  description,
  action,
  className,
}: InlineCtaProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-cited-line border-l-[3px] border-l-cited-citation bg-cited-surface px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-9",
        "flex flex-col gap-5 cited-note-shadow",
        className,
      )}
    >
      <span
        className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-cited-citation/10 to-transparent"
        aria-hidden
      />
      <div className="relative">
        <h3 className="type-heading text-[clamp(1.25rem,2.5vw,1.65rem)] text-cited-ink-strong">
          {title}
        </h3>
        {description ? (
          <p className="mt-2 max-w-xl type-body-sm text-cited-ink-muted">
            {description}
          </p>
        ) : null}
      </div>
      <div className="relative w-full shrink-0 sm:w-auto">{action}</div>
    </div>
  );
}
