"use client";

import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { AnswerSourceItem } from "@/lib/evidence/types";
import { cn, getHostname, truncateMiddle } from "@/lib/utils";

type AllSourcesListProps = {
  sources: AnswerSourceItem[];
  domainHostname?: string | null;
  className?: string;
};

function relationMeta(relation: AnswerSourceItem["relation"]): {
  label: string;
  variant: "citation" | "competitor" | "default";
} {
  switch (relation) {
    case "your_domain":
      return { label: "Your domain", variant: "citation" };
    case "competitor":
      return { label: "Competitor", variant: "competitor" };
    default:
      return { label: "Other source", variant: "default" };
  }
}

export function AllSourcesList({
  sources,
  domainHostname,
  className,
}: AllSourcesListProps) {
  if (sources.length === 0) {
    return (
      <div
        className={cn(
          "rounded-md border border-dashed border-cited-line bg-cited-surface/60 px-3 py-4",
          className,
        )}
      >
        <p className="type-micro text-cited-ink-faint">All sources in answer</p>
        <p className="mt-2 type-body-sm text-cited-ink-muted">
          No attributable sources were returned in this AI answer.
        </p>
      </div>
    );
  }

  const yourDomainCount = sources.filter(
    (source) => source.relation === "your_domain",
  ).length;

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <p className="type-micro text-cited-ink-faint">All sources in answer</p>
        <p className="mt-1 type-body-sm text-cited-ink-muted">
          {sources.length} source{sources.length === 1 ? "" : "s"} returned by
          the provider
          {domainHostname && yourDomainCount === 0
            ? `. ${domainHostname} was not among them.`
            : yourDomainCount > 0
              ? `. ${yourDomainCount} matched your domain.`
              : "."}
        </p>
      </div>
      <ul className="space-y-2" aria-label="All sources in answer">
        {sources.map((source, index) => {
          const meta = relationMeta(source.relation);
          const hostname =
            source.hostname ?? (source.url ? getHostname(source.url) : null);
          const pathDisplay = (() => {
            if (!source.url) return "";
            try {
              const url = new URL(source.url);
              const path = `${url.pathname}${url.search}`;
              return path === "/" ? "" : truncateMiddle(path, 40);
            } catch {
              return "";
            }
          })();

          return (
            <li key={`${source.url ?? source.hostname ?? "source"}-${index}`}>
              <article className="rounded-md border border-cited-line-subtle bg-cited-surface px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  {source.position != null ? (
                    <span className="font-mono text-[11px] text-cited-ink-faint">
                      #{source.position}
                    </span>
                  ) : null}
                </div>

                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex max-w-full items-center gap-1.5 text-cited-ink transition hover:text-cited-citation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent/50"
                  >
                    <span className="min-w-0 truncate font-mono text-xs">
                      {source.title ?? (
                        <>
                          <span>{hostname}</span>
                          {pathDisplay ? (
                            <span className="text-cited-ink-faint">
                              {pathDisplay}
                            </span>
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
                  <p className="mt-2 font-mono text-xs text-cited-ink">
                    {hostname}
                  </p>
                ) : null}

                {source.snippet ? (
                  <p className="mt-2 type-body-sm line-clamp-3 text-cited-ink-subtle">
                    {source.snippet}
                  </p>
                ) : null}
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
