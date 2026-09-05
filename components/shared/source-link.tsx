import { ExternalLink } from "lucide-react";

import { getHostname, truncateMiddle, cn } from "@/lib/utils";

type SourceLinkProps = {
  href: string;
  title?: string;
  snippet?: string;
  className?: string;
};

export function SourceLink({ href, title, snippet, className }: SourceLinkProps) {
  const hostname = getHostname(href) ?? href;
  const pathDisplay = (() => {
    try {
      const url = new URL(href);
      const path = `${url.pathname}${url.search}`;
      return path === "/" ? "" : truncateMiddle(path, 36);
    } catch {
      return "";
    }
  })();

  return (
    <div className={cn("min-w-0", className)}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={href}
        className="group inline-flex max-w-full items-center gap-1.5 rounded-sm text-cited-ink transition hover:text-cited-citation focus-visible:outline-none"
      >
        <span className="min-w-0 truncate font-mono text-xs tracking-[0.02em]">
          {title ? (
            <span className="text-cited-ink">{title}</span>
          ) : (
            <>
              <span>{hostname}</span>
              {pathDisplay ? (
                <span className="text-cited-ink-faint">{pathDisplay}</span>
              ) : null}
            </>
          )}
        </span>
        <ExternalLink
          className="h-3 w-3 shrink-0 text-cited-ink-faint transition group-hover:translate-x-px group-hover:-translate-y-px group-hover:text-cited-citation motion-reduce:transform-none"
          aria-hidden
        />
        <span className="sr-only">(opens in new tab)</span>
      </a>
      {title ? (
        <p className="mt-0.5 truncate font-mono text-[11px] text-cited-ink-faint">
          {hostname}
          {pathDisplay}
        </p>
      ) : null}
      {snippet ? (
        <p className="mt-1.5 type-body-sm line-clamp-2 text-cited-ink-subtle">
          {snippet}
        </p>
      ) : null}
    </div>
  );
}
