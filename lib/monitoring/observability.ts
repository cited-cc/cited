import { logger } from "@/lib/security/logger";
import type { AiSurfaceKey } from "@/types/product";

export type MonitoringObservabilityEvent =
  | "monitoring.scan.queued"
  | "monitoring.scan.claimed"
  | "monitoring.provider.submitted"
  | "monitoring.provider.pending"
  | "monitoring.provider.completed"
  | "monitoring.classification.completed"
  | "monitoring.evidence.persisted"
  | "monitoring.scan.retry_scheduled"
  | "monitoring.scan.failed"
  | "monitoring.scan.canceled"
  | "monitoring.lease.recovered";

export type MonitoringObservabilityPayload = {
  event: MonitoringObservabilityEvent;
  scanRunId: string;
  workspaceId: string;
  monitorConfigurationId?: string;
  aiSurface?: AiSurfaceKey;
  providerId?: string;
  attemptNumber?: number;
  durationMs?: number;
  errorCode?: string;
  correlationId?: string;
  phase?: string;
};

/** Structured monitoring lifecycle log without prompt/response/credential content. */
export function emitMonitoringEvent(
  payload: MonitoringObservabilityPayload,
): void {
  logger.info("Monitoring lifecycle event", {
    ...payload,
  });
}
