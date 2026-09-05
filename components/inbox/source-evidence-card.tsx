import { ExternalLink } from "lucide-react";

import type { InboxEventListItem } from "@/lib/inbox/types";
import { getHostname, truncateMiddle, cn } from "@/lib/utils";

type SourceEvidenceCardProps = {
  event: InboxEventListItem;
  className?: string;
};

export function SourceEvidenceCard({
  event,
  className,
}: SourceEvidenceCardProps) {
  if (event.eventType === "mention") {
    return (
      <div
        className={cn(
          "rounded-md border border-cited-line-subtle bg-cited-surface px-3 py-3",
          className,
        )}
      >
        <p className="type-micro text-cited-ink-faint">Source</p>
        <p className="mt-2 type-body-sm text-cited-ink-muted">
          No direct source citation was detected. Cited found a configured brand
          or product mention in the monitored response.
        </p>
      </div>
    );
  }

  if (event.eventType === "missed_opportunity") {
    return (
      <div
        className={cn(
          "rounded-md border border-cited-line-subtle bg-cited-surface px-3 py-3",
          className,
        )}
      >
        <p className="type-micro text-cited-ink-faint">Source</p>
        <p className="mt-2 type-body-sm text-cited-ink-muted">
          Your verified domain was absent from this monitored result. A
          configured competitor source appeared instead.
        </p>
        {event.citedHostname ? (
          <p className="mt-2 font-mono text-xs text-cited-warning">
            Competitor: {event.citedHostname}
          </p>
        ) : null}
      </div>
    );
  }

  if (!event.citedUrl && !event.citedHostname) {
    return (
      <div
        className={cn(
          "rounded-md border border-cited-line-subtle bg-cited-surface px-3 py-3",
          className,
        )}
      >
        <p className="type-micro text-cited-ink-faint">Source</p>
        <p className="mt-2 type-body-sm text-cited-ink-muted">
          No attributable source URL was retained for this result.
        </p>
      </div>
    );
  }

  const hostname =
    event.citedHostname ??
    (event.citedUrl ? getHostname(event.citedUrl) : null) ??
    "Source";
  const pathDisplay = (() => {
    if (!event.citedUrl) return "";
    try {
      const url = new URL(event.citedUrl);
      const path = `${url.pathname}${url.search}`;
      return path === "/" ? "" : truncateMiddle(path, 40);
    } catch {
      return "";
    }
  })();

  return (
    <div
      className={cn(
        "rounded-md border border-cited-line-subtle bg-cited-surface px-3 py-3",
        className,
      )}
    >
      <p className="type-micro text-cited-ink-faint">Source</p>
      {event.citedUrl ? (
        <a
          href={event.citedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex max-w-full items-center gap-1.5 text-cited-ink transition hover:text-cited-citation focus-visible:outline-none"
        >
          <span className="min-w-0 truncate font-mono text-xs">
            {event.sourceTitle ?? (
              <>
                <span>{hostname}</span>
                {pathDisplay ? (
                  <span className="text-cited-ink-faint">{pathDisplay}</span>
                ) : null}
              </>
            )}
          </span>
          <ExternalLink className="h-3 w-3 shrink-0 text-cited-ink-faint" aria-hidden />
          <span className="sr-only">(opens in new tab)</span>
        </a>
      ) : (
        <p className="mt-2 font-mono text-xs text-cited-ink">{hostname}</p>
      )}
      {event.sourceTitle && event.citedUrl ? (
        <p className="mt-1 truncate font-mono text-[11px] text-cited-ink-faint">
          {hostname}
          {pathDisplay}
        </p>
      ) : null}
      {event.sourceSnippet ? (
        <p className="mt-2 type-body-sm line-clamp-3 text-cited-ink-subtle">
          {event.sourceSnippet}
        </p>
      ) : null}
    </div>
  );
}
