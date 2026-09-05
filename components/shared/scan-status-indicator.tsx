import { ScanPulse } from "@/components/shared/cited-glyphs";
import {
  resolveScanDisplayStatus,
  scanDisplayStatusLabel,
  type ScanDisplayInput,
  type ScanDisplayStatus,
} from "@/lib/monitoring/scan-display-status";
import { cn } from "@/lib/utils";

export type ScanStatus = ScanDisplayStatus;

const STATUS_COPY: Record<ScanStatus, string> = {
  queued: scanDisplayStatusLabel("queued"),
  running: scanDisplayStatusLabel("running"),
  retrying: scanDisplayStatusLabel("retrying"),
  completed: scanDisplayStatusLabel("completed"),
  partial: scanDisplayStatusLabel("partial"),
  failed: scanDisplayStatusLabel("failed"),
  canceled: scanDisplayStatusLabel("canceled"),
  paused: scanDisplayStatusLabel("paused"),
};

type ScanStatusIndicatorProps = {
  status: ScanStatus;
  /** Optional raw scan fields for accurate retry/running display. */
  scan?: ScanDisplayInput;
  className?: string;
  showLabel?: boolean;
};

export function ScanStatusIndicator({
  status: statusProp,
  scan,
  className,
  showLabel = true,
}: ScanStatusIndicatorProps) {
  const status = scan ? resolveScanDisplayStatus(scan) : statusProp;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.06em] text-cited-ink-muted",
        className,
      )}
      role="status"
      aria-live={status === "running" || status === "retrying" ? "polite" : undefined}
      aria-label={`Scan status: ${STATUS_COPY[status]}`}
    >
      {status === "running" || status === "retrying" ? (
        <ScanPulse />
      ) : (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            status === "queued" && "bg-cited-ink-faint",
            status === "completed" && "bg-cited-accent",
            status === "partial" && "bg-cited-warning",
            status === "failed" && "bg-cited-danger",
            status === "canceled" && "bg-cited-ink-subtle",
            status === "paused" && "bg-cited-ink-subtle",
          )}
          aria-hidden
        />
      )}
      {showLabel ? <span>{STATUS_COPY[status]}</span> : null}
    </span>
  );
}
