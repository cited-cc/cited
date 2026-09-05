import type { ScanRunInsightSnapshot } from "@/lib/evidence/types";
import { cn } from "@/lib/utils";

type MonitorLastScanInsightsProps = {
  insight: ScanRunInsightSnapshot | null;
  className?: string;
};

function formatCost(value: number | null | undefined): string | null {
  if (typeof value !== "number" || value <= 0) return null;
  return `$${value.toFixed(4)}`;
}

export function MonitorLastScanInsights({
  insight,
  className,
}: MonitorLastScanInsightsProps) {
  if (!insight) return null;

  const parts: string[] = [];
  parts.push(
    `${insight.citationCount} source${insight.citationCount === 1 ? "" : "s"} in answer`,
  );
  parts.push(
    `${insight.eventCount} event${insight.eventCount === 1 ? "" : "s"} matched`,
  );
  if (insight.modelName) parts.push(`Model: ${insight.modelName}`);
  const cost = formatCost(insight.providerCostUsd);
  if (cost) parts.push(`Cost: ${cost}`);
  if (insight.missingAiOverview) parts.push("No AI Overview returned");

  return (
    <p className={cn("type-body-sm text-cited-ink-muted", className)}>
      Last scan: {parts.join(" · ")}
    </p>
  );
}
