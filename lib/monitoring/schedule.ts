import type { MonitoringFrequency } from "@/types/product";

import type { ScanRunType } from "@/lib/monitoring/types";

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * Stable hash of a UUID-like string into a non-negative integer.
 * Used for deterministic schedule staggering (not cryptographic).
 */
export function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

/**
 * Minute-of-day offset (0..1439) derived from monitor id for staggering.
 */
export function staggerMinutes(monitorConfigurationId: string): number {
  return stableHash(monitorConfigurationId) % (24 * 60);
}

function applyStagger(dayStart: Date, monitorConfigurationId: string): Date {
  const minutes = staggerMinutes(monitorConfigurationId);
  return new Date(dayStart.getTime() + minutes * MS_PER_MINUTE);
}

/**
 * Two stable weekday slots (0=Sun..6=Sat) spaced ~3-4 days apart.
 */
export function twiceWeeklyWeekdays(
  monitorConfigurationId: string,
): [number, number] {
  const first = stableHash(monitorConfigurationId) % 7;
  const second = (first + 3 + (stableHash(`${monitorConfigurationId}:b`) % 2)) % 7;
  if (first === second) {
    return [first, (first + 3) % 7];
  }
  return first < second ? [first, second] : [second, first];
}

function nextWeekdayOccurrence(
  from: Date,
  weekday: number,
  monitorConfigurationId: string,
): Date {
  const dayStart = startOfUtcDay(from);
  for (let offset = 0; offset < 14; offset += 1) {
    const candidateDay = addUtcDays(dayStart, offset);
    if (candidateDay.getUTCDay() !== weekday) continue;
    const slotted = applyStagger(candidateDay, monitorConfigurationId);
    if (slotted.getTime() > from.getTime()) {
      return slotted;
    }
  }
  // Fallback: one week later
  return applyStagger(addUtcDays(dayStart, 7), monitorConfigurationId);
}

/**
 * Next recurring run after `from` for the given cadence.
 * Never returns a time <= from.
 */
export function calculateNextRunAt(input: {
  monitorConfigurationId: string;
  cadence: MonitoringFrequency;
  from: Date;
}): Date {
  const { monitorConfigurationId, cadence, from } = input;

  switch (cadence) {
    case "manual":
      // Manual monitors are not auto-scheduled.
      return new Date(from.getTime() + 365 * MS_PER_DAY);
    case "daily": {
      const todaySlot = applyStagger(startOfUtcDay(from), monitorConfigurationId);
      if (todaySlot.getTime() > from.getTime()) {
        return todaySlot;
      }
      return applyStagger(
        addUtcDays(startOfUtcDay(from), 1),
        monitorConfigurationId,
      );
    }
    case "weekly": {
      const weekday = stableHash(monitorConfigurationId) % 7;
      return nextWeekdayOccurrence(from, weekday, monitorConfigurationId);
    }
    case "twice_weekly": {
      const [a, b] = twiceWeeklyWeekdays(monitorConfigurationId);
      const nextA = nextWeekdayOccurrence(from, a, monitorConfigurationId);
      const nextB = nextWeekdayOccurrence(from, b, monitorConfigurationId);
      return nextA.getTime() <= nextB.getTime() ? nextA : nextB;
    }
    default: {
      const _exhaustive: never = cadence;
      return _exhaustive;
    }
  }
}

/**
 * Normalize a scheduled timestamp to a deterministic slot for uniqueness.
 * Truncates to the minute in UTC.
 */
export function normalizeScheduleSlot(date: Date): Date {
  const copy = new Date(date.getTime());
  copy.setUTCSeconds(0, 0);
  return copy;
}

/**
 * After downtime, skip catch-up storms: if the due slot is older than
 * staleMinutes, advance to the next valid future slot instead of backfilling.
 */
export function resolveDueScheduledFor(input: {
  monitorConfigurationId: string;
  cadence: MonitoringFrequency;
  nextRunAt: Date;
  now: Date;
  staleMinutes: number;
}): Date {
  const ageMs = input.now.getTime() - input.nextRunAt.getTime();
  const staleMs = input.staleMinutes * MS_PER_MINUTE;
  if (ageMs <= staleMs) {
    return normalizeScheduleSlot(input.nextRunAt);
  }
  return normalizeScheduleSlot(
    calculateNextRunAt({
      monitorConfigurationId: input.monitorConfigurationId,
      cadence: input.cadence,
      from: input.now,
    }),
  );
}

export function buildIdempotencyKey(input: {
  monitorConfigurationId: string;
  scheduledFor: Date;
  runType: ScanRunType;
}): string {
  const slot = normalizeScheduleSlot(input.scheduledFor).toISOString();
  return `${input.monitorConfigurationId}:${slot}:${input.runType}`;
}

export function computeBackoffSeconds(attemptCount: number): number {
  const base = Math.min(2 ** Math.max(0, attemptCount - 1), 32) * 30;
  const jitter = stableHash(`backoff:${attemptCount}`) % 15;
  return base + jitter;
}
