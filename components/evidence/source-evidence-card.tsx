"use client";

import { ExternalLink } from "lucide-react";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EvidenceSourceItem } from "@/lib/evidence/types";
import type { CitationEvidenceType } from "@/types/product";
import { getHostname, truncateMiddle, cn } from "@/lib/utils";
import { toSafeHttpsUrl } from "@/lib/inbox/safe-url";

type SourceEvidenceCardProps = {
  source: EvidenceSourceItem;
  onAnnotate?: (source: EvidenceSourceItem) => void;
  canAnnotate?: boolean;
  className?: string;
};

function evidenceTypeMeta(type: CitationEvidenceType): {
  label: string;
  badge: BadgeVariant;
} {
  switch (type) {
    case "source_link":
      return { label: "Citation", badge: "citation" };
    case "brand_match":
    case "domain_match":
      return { label: "Mention", badge: "mention" };
    case "recommendation_excerpt":
      return { label: "Recommendation", badge: "recommendation" };
    case "competitor_match":
      return { label: "Competitor", badge: "competitor" };
    case "response_excerpt":
      return { label: "Evidence", badge: "default" };
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function SourceEvidenceCard({
  source,
  onAnnotate,
  canAnnotate = false,
  className,
}: SourceEvidenceCardProps) {
  const meta = evidenceTypeMeta(source.type);
  const safeUrl = toSafeHttpsUrl(source.url);
  const hostname =
    source.hostname ?? (safeUrl ? getHostname(safeUrl) : null) ?? null;

  const pathDisplay = (() => {
    if (!safeUrl) return "";
    try {
      const url = new URL(safeUrl);
      const path = `${url.pathname}${url.search}`;
      return path === "/" ? "" : truncateMiddle(path, 40);
    } catch {
      return "";
    }
  })();

  return (
    <article
      className={cn(
        "rounded-md border border-cited-line-subtle border-l-2 border-l-cited-line-strong bg-cited-surface px-3 py-3",
        source.type === "source_link" && "border-l-cited-citation",
        (source.type === "brand_match" || source.type === "domain_match") &&
          "border-l-cited-info",
        source.type === "recommendation_excerpt" && "border-l-cited-accent",
        source.type === "competitor_match" && "border-l-cited-warning",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Badge variant={meta.badge}>{meta.label}</Badge>
        {source.position != null ? (
          <span className="font-mono text-[11px] text-cited-ink-faint">
            #{source.position}
          </span>
        ) : null}
      </div>

      {safeUrl ? (
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex max-w-full items-center gap-1.5 text-cited-ink transition hover:text-cited-citation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent/50"
        >
          <span className="min-w-0 truncate font-mono text-xs">
            {source.title ?? (
              <>
                <span>{hostname}</span>
                {pathDisplay ? (
                  <span className="text-cited-ink-faint">{pathDisplay}</span>
                ) : null}
              </>
            )}
          </span>
          <ExternalLink
            className="h-3 w-3 shrink-0 text-cited-ink-faint"
            aria-hidden
          />
          <span className="sr-only">(opens in new tab)</span>
        </a>
      ) : hostname ? (
        <p className="mt-2 font-mono text-xs text-cited-ink">{hostname}</p>
      ) : null}

      {source.title && safeUrl && hostname ? (
        <p className="mt-1 truncate font-mono text-[11px] text-cited-ink-faint">
          {hostname}
          {pathDisplay}
        </p>
      ) : null}

      {source.text ? (
        <p className="mt-2 type-body-sm line-clamp-4 text-cited-ink-subtle">
          {source.text}
        </p>
      ) : null}

      {canAnnotate && onAnnotate ? (
        <div className="mt-3">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onAnnotate(source)}
          >
            Annotate source
          </Button>
        </div>
      ) : null}
    </article>
  );
}
