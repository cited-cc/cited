import { describe, expect, it } from "vitest";

import { buildIdempotencyKey, computeBackoffSeconds } from "@/lib/monitoring/schedule";
import { buildExternalRequestKey } from "@/lib/monitoring/scan-transitions";
import { resolveMonitoringOperationalLimits } from "@/lib/monitoring/limits";
import { isRetryableCategory } from "@/lib/monitoring/errors";

describe("monitoring lifecycle helpers", () => {
  it("builds stable idempotency keys without prompt text", () => {
    const slot = new Date("2026-09-04T12:00:00.000Z");
    const key = buildIdempotencyKey({
      monitorConfigurationId: "mc-123",
      scheduledFor: slot,
      runType: "recurring",
    });
    expect(key).toBe("mc-123:2026-09-04T12:00:00.000Z:recurring");
    expect(key).not.toContain("prompt");
  });

  it("uses deterministic backoff with jitter bound", () => {
    const first = computeBackoffSeconds(1);
    const second = computeBackoffSeconds(1);
    expect(first).toBe(second);
    expect(first).toBeGreaterThanOrEqual(30);
    expect(computeBackoffSeconds(10)).toBeLessThanOrEqual(32 * 30 + 15);
  });

  it("builds stable external request keys per attempt", () => {
    expect(
      buildExternalRequestKey({ scanRunId: "scan-1", attemptCount: 0 }),
    ).toBe("cited:scan:scan-1:attempt:0");
    expect(
      buildExternalRequestKey({ scanRunId: "scan-1", attemptCount: 1 }),
    ).not.toBe("cited:scan:scan-1:attempt:0");
  });

  it("marks persistence and provider outages as retryable", () => {
    expect(isRetryableCategory("internal_persistence_error")).toBe(true);
    expect(isRetryableCategory("provider_rate_limited")).toBe(true);
    expect(isRetryableCategory("provider_validation_error")).toBe(false);
  });

  it("exposes conservative operational defaults", () => {
    const limits = resolveMonitoringOperationalLimits();
    expect(limits.maxScanAttempts).toBeGreaterThanOrEqual(1);
    expect(limits.maxPollAttempts).toBeGreaterThanOrEqual(1);
    expect(limits.maxCitationsPerResponse).toBeGreaterThan(0);
  });
});
