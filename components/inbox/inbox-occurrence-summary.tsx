import type { InboxOccurrenceItem } from "@/lib/inbox/types";
import { formatAbsoluteUtc, formatRelativeUtc } from "@/lib/inbox/serializers";
import { SURFACE_LABELS } from "@/components/shared/ai-surface-badge";
import { cn } from "@/lib/utils";

type InboxOccurrenceSummaryProps = {
  firstSeenAt: string;
  lastSeenAt: string;
  occurrenceCount: number;
  recentOccurrences: InboxOccurrenceItem[];
  className?: string;
};

export function InboxOccurrenceSummary({
  firstSeenAt,
  lastSeenAt,
  occurrenceCount,
  recentOccurrences,
  className,
}: InboxOccurrenceSummaryProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <p className="type-micro text-cited-ink-faint">First seen</p>
          <p className="mt-1 font-mono text-xs text-cited-ink">
            <time dateTime={firstSeenAt} title={formatAbsoluteUtc(firstSeenAt)}>
              {formatRelativeUtc(firstSeenAt)}
            </time>
          </p>
        </div>
        <div>
          <p className="type-micro text-cited-ink-faint">Last observed</p>
          <p className="mt-1 font-mono text-xs text-cited-ink">
            <time dateTime={lastSeenAt} title={formatAbsoluteUtc(lastSeenAt)}>
              {formatRelativeUtc(lastSeenAt)}
            </time>
          </p>
        </div>
        <div>
          <p className="type-micro text-cited-ink-faint">Observed</p>
          <p className="mt-1 font-mono text-xs text-cited-ink">
            {occurrenceCount} {occurrenceCount === 1 ? "time" : "times"}
          </p>
        </div>
      </div>

      {recentOccurrences.length > 0 ? (
        <div>
          <p className="type-micro text-cited-ink-faint">Recent appearances</p>
          <ol className="mt-2 space-y-2 border-l border-cited-line-subtle pl-3">
            {recentOccurrences.map((occurrence) => (
              <li key={`${occurrence.observedAt}-${occurrence.sourceUrl ?? occurrence.sourceHostname ?? "row"}`}>
                <p className="font-mono text-[11px] text-cited-ink-muted">
                  <time
                    dateTime={occurrence.observedAt}
                    title={formatAbsoluteUtc(occurrence.observedAt)}
                  >
                    {formatRelativeUtc(occurrence.observedAt)}
                  </time>
                  {occurrence.aiSurface
                    ? ` · ${SURFACE_LABELS[occurrence.aiSurface]}`
                    : null}
                  {occurrence.sourceHostname
                    ? ` · ${occurrence.sourceHostname}`
                    : null}
                  {occurrence.citationPosition != null
                    ? ` · #${occurrence.citationPosition}`
                    : null}
                </p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
