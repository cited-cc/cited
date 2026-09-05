import { SURFACE_LABELS } from "@/components/shared/ai-surface-badge";
import type { CitationEventDetail } from "@/lib/evidence/types";
import {
  formatAbsoluteUtc,
  formatRelativeUtc,
} from "@/lib/inbox/serializers";
import { cn } from "@/lib/utils";

type CitationNoteSummaryProps = {
  detail: CitationEventDetail;
  className?: string;
};

export function CitationNoteSummary({
  detail,
  className,
}: CitationNoteSummaryProps) {
  const { event } = detail;
  const surface = event.aiSurface ? SURFACE_LABELS[event.aiSurface] : null;

  return (
    <dl
      className={cn(
        "grid gap-3 rounded-md border border-cited-line-subtle bg-cited-surface px-3 py-3 sm:grid-cols-2 lg:grid-cols-5",
        className,
      )}
    >
      <div>
        <dt className="type-micro text-cited-ink-faint">Prompt</dt>
        <dd className="mt-1.5 type-body-sm line-clamp-2 text-cited-ink">
          {event.promptText ?? "Prompt text was not retained."}
        </dd>
      </div>
      <div>
        <dt className="type-micro text-cited-ink-faint">Surface</dt>
        <dd className="mt-1.5 font-mono text-xs text-cited-ink">
          {surface ?? "Unknown"}
        </dd>
      </div>
      <div>
        <dt className="type-micro text-cited-ink-faint">First seen</dt>
        <dd className="mt-1.5 font-mono text-xs text-cited-ink">
          <time
            dateTime={event.firstSeenAt}
            title={formatAbsoluteUtc(event.firstSeenAt)}
          >
            {formatRelativeUtc(event.firstSeenAt)}
          </time>
        </dd>
      </div>
      <div>
        <dt className="type-micro text-cited-ink-faint">Last observed</dt>
        <dd className="mt-1.5 font-mono text-xs text-cited-ink">
          <time
            dateTime={event.lastSeenAt}
            title={formatAbsoluteUtc(event.lastSeenAt)}
          >
            {formatRelativeUtc(event.lastSeenAt)}
          </time>
        </dd>
      </div>
      <div>
        <dt className="type-micro text-cited-ink-faint">Observations</dt>
        <dd className="mt-1.5 font-mono text-xs text-cited-ink">
          {event.occurrenceCount}{" "}
          {event.occurrenceCount === 1 ? "time" : "times"}
        </dd>
      </div>
    </dl>
  );
}
