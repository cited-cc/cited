import { describe, expect, it } from "vitest";

import {
  buildIdempotencyKey,
  calculateNextRunAt,
  normalizeScheduleSlot,
  resolveDueScheduledFor,
  staggerMinutes,
  twiceWeeklyWeekdays,
} from "@/lib/monitoring/schedule";

describe("monitoring schedule", () => {
  const monitorId = "11111111-2222-3333-4444-555555555555";

  it("staggers schedules deterministically from monitor id", () => {
    expect(staggerMinutes(monitorId)).toBe(staggerMinutes(monitorId));
    expect(staggerMinutes(monitorId)).not.toBe(
      staggerMinutes("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
    );
  });

  it("calculates stable twice-weekly weekday slots", () => {
    const [a, b] = twiceWeeklyWeekdays(monitorId);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThanOrEqual(6);
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThanOrEqual(6);
    expect(a).not.toBe(b);
  });

  it("calculates next twice-weekly run after from", () => {
    const from = new Date("2026-07-09T00:00:00.000Z");
    const next = calculateNextRunAt({
      monitorConfigurationId: monitorId,
      cadence: "twice_weekly",
      from,
    });
    expect(next.getTime()).toBeGreaterThan(from.getTime());
    const again = calculateNextRunAt({
      monitorConfigurationId: monitorId,
      cadence: "twice_weekly",
      from,
    });
    expect(again.toISOString()).toBe(next.toISOString());
  });

  it("calculates next daily run with stable UTC slot", () => {
    const from = new Date("2026-07-09T23:50:00.000Z");
    const next = calculateNextRunAt({
      monitorConfigurationId: monitorId,
      cadence: "daily",
      from,
    });
    expect(next.getTime()).toBeGreaterThan(from.getTime());
    expect(next.getUTCMinutes()).toBe(staggerMinutes(monitorId) % 60);
  });

  it("avoids catch-up storms for stale schedules", () => {
    const now = new Date("2026-07-09T12:00:00.000Z");
    const stale = new Date("2026-06-01T12:00:00.000Z");
    const resolved = resolveDueScheduledFor({
      monitorConfigurationId: monitorId,
      cadence: "daily",
      nextRunAt: stale,
      now,
      staleMinutes: 90,
    });
    expect(resolved.getTime()).toBeGreaterThan(now.getTime() - 60_000);
  });

  it("builds stable idempotency keys", () => {
    const scheduledFor = normalizeScheduleSlot(
      new Date("2026-07-09T12:34:56.789Z"),
    );
    const key = buildIdempotencyKey({
      monitorConfigurationId: monitorId,
      scheduledFor,
      runType: "baseline",
    });
    expect(key).toContain(monitorId);
    expect(key).toContain("baseline");
    expect(key).toBe(
      buildIdempotencyKey({
        monitorConfigurationId: monitorId,
        scheduledFor,
        runType: "baseline",
      }),
    );
  });
});
