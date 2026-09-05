"use client";

import type {
  ProviderMetadataSnapshot,
  ScanRunInsightSnapshot,
} from "@/lib/evidence/types";
import { cn } from "@/lib/utils";

type ScanInsightsCardProps = {
  insight: ScanRunInsightSnapshot | null;
  providerMetadata?: ProviderMetadataSnapshot | null;
  className?: string;
};

function formatCost(value: number | null | undefined): string | null {
  if (typeof value !== "number" || value <= 0) return null;
  return `$${value.toFixed(4)}`;
}

function formatTokens(
  input: number | null | undefined,
  output: number | null | undefined,
): string | null {
  if (typeof input !== "number" && typeof output !== "number") return null;
  const parts: string[] = [];
  if (typeof input === "number") parts.push(`${input.toLocaleString()} in`);
  if (typeof output === "number") parts.push(`${output.toLocaleString()} out`);
  return parts.join(" · ");
}

export function ScanInsightsCard({
  insight,
  providerMetadata,
  className,
}: ScanInsightsCardProps) {
  const metadata = providerMetadata ?? null;
  const combined = insight ?? {
    citationCount: 0,
    eventCount: 0,
    modelName: null,
    responseRetained: true,
  };

  const cost =
    formatCost(combined.providerCostUsd) ??
    formatCost(metadata?.providerCostUsd ?? metadata?.moneySpent);
  const tokens = formatTokens(
    combined.inputTokens ?? metadata?.inputTokens,
    combined.outputTokens ?? metadata?.outputTokens,
  );
  const missingOverview =
    combined.missingAiOverview ?? metadata?.missingAiOverview ?? false;
  const asyncOverview = metadata?.asynchronousAiOverview ?? false;
  const webSearch = metadata?.webSearch;

  const hasDetails =
    combined.citationCount > 0 ||
    combined.eventCount > 0 ||
    Boolean(combined.modelName) ||
    Boolean(cost) ||
    Boolean(tokens) ||
    missingOverview ||
    asyncOverview ||
    webSearch === true;

  if (!hasDetails) return null;

  return (
    <section
      className={cn(
        "rounded-md border border-cited-line-subtle bg-cited-surface px-3 py-3",
        className,
      )}
      aria-label="Scan insights"
    >
      <p className="type-micro text-cited-ink-faint">Scan insights</p>

      {missingOverview ? (
        <p className="mt-2 type-body-sm text-cited-ink-muted">
          Google did not return an AI Overview for this query on the last check.
        </p>
      ) : null}

      {asyncOverview ? (
        <p className="mt-2 type-body-sm text-cited-ink-muted">
          AI Overview was loading asynchronously when Cited captured this result.
        </p>
      ) : null}

      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="type-micro text-cited-ink-faint">Sources in answer</dt>
          <dd className="mt-1 font-mono text-xs text-cited-ink">
            {combined.citationCount}
          </dd>
        </div>
        <div>
          <dt className="type-micro text-cited-ink-faint">Cited events</dt>
          <dd className="mt-1 font-mono text-xs text-cited-ink">
            {combined.eventCount}
          </dd>
        </div>
        {combined.modelName ? (
          <div>
            <dt className="type-micro text-cited-ink-faint">Model</dt>
            <dd className="mt-1 font-mono text-xs text-cited-ink">
              {combined.modelName}
            </dd>
          </div>
        ) : null}
        {tokens ? (
          <div>
            <dt className="type-micro text-cited-ink-faint">Tokens</dt>
            <dd className="mt-1 font-mono text-xs text-cited-ink">{tokens}</dd>
          </div>
        ) : null}
        {cost ? (
          <div>
            <dt className="type-micro text-cited-ink-faint">Provider cost</dt>
            <dd className="mt-1 font-mono text-xs text-cited-ink">{cost}</dd>
          </div>
        ) : null}
        {webSearch === true ? (
          <div>
            <dt className="type-micro text-cited-ink-faint">Web search</dt>
            <dd className="mt-1 font-mono text-xs text-cited-ink">Used</dd>
          </div>
        ) : null}
        {!combined.responseRetained ? (
          <div className="sm:col-span-2">
            <dt className="type-micro text-cited-ink-faint">Response text</dt>
            <dd className="mt-1 type-body-sm text-cited-ink-muted">
              Full answer text was not retained for this check.
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
