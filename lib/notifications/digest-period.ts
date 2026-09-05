/**
 * Digest period helpers. Timezone-aware when configured; UTC fallback.
 */

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function isValidIanaTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function normalizeDigestTimezone(tz: string | null | undefined): string {
  if (!tz || !isValidIanaTimezone(tz)) return "UTC";
  return tz;
}

export function normalizeDigestWeekday(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 6) return 1;
  return value;
}

export function normalizeDigestHour(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 23) return 9;
  return value;
}

/**
 * Get calendar parts in a timezone.
 */
export function getZonedParts(
  date: Date,
  timeZone: string,
): { year: number; month: number; day: number; hour: number; weekday: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "0";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    weekday: weekdayMap[get("weekday")] ?? 0,
  };
}

/**
 * Approximate UTC instant for a local wall time in a timezone.
 */
export function zonedWallTimeToUtc(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute?: number;
  timeZone: string;
}): Date {
  const utcGuess = Date.UTC(
    input.year,
    input.month - 1,
    input.day,
    input.hour,
    input.minute ?? 0,
    0,
  );
  // Iterate to correct for timezone offset.
  let instant = utcGuess;
  for (let i = 0; i < 3; i += 1) {
    const parts = getZonedParts(new Date(instant), input.timeZone);
    const asUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      0,
      0,
    );
    const target = Date.UTC(
      input.year,
      input.month - 1,
      input.day,
      input.hour,
      input.minute ?? 0,
      0,
    );
    instant += target - asUtc;
  }
  return new Date(instant);
}

/**
 * Previous completed digest period ending at the most recent scheduled digest time.
 */
export function calculateDigestPeriod(input: {
  now?: Date;
  digestWeekday: number;
  digestHour: number;
  digestTimezone?: string | null;
}): {
  periodStart: Date;
  periodEnd: Date;
  timezone: string;
  shouldSendNow: boolean;
} {
  const now = input.now ?? new Date();
  const timeZone = normalizeDigestTimezone(input.digestTimezone);
  const weekday = normalizeDigestWeekday(input.digestWeekday);
  const hour = normalizeDigestHour(input.digestHour);
  const parts = getZonedParts(now, timeZone);

  // Find the most recent digest boundary (weekday + hour) at or before now.
  let dayOffset = (parts.weekday - weekday + 7) % 7;
  if (dayOffset === 0 && parts.hour < hour) {
    dayOffset = 7;
  }

  const endLocal = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day) -
      dayOffset * 24 * 60 * 60 * 1000,
  );
  const endParts = {
    year: endLocal.getUTCFullYear(),
    month: endLocal.getUTCMonth() + 1,
    day: endLocal.getUTCDate(),
    hour,
  };

  const periodEnd = zonedWallTimeToUtc({ ...endParts, timeZone });
  const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  // shouldSendNow: within the digest hour window after periodEnd.
  const msSinceEnd = now.getTime() - periodEnd.getTime();
  const shouldSendNow =
    msSinceEnd >= 0 && msSinceEnd < 60 * 60 * 1000; // first hour after boundary

  return { periodStart, periodEnd, timezone: timeZone, shouldSendNow };
}

export function formatDigestPeriodLabel(
  periodStart: Date,
  periodEnd: Date,
  timeZone: string,
): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${fmt.format(periodStart)} - ${fmt.format(periodEnd)} (${timeZone})`;
}

export function weekdayLabel(weekday: number): string {
  return WEEKDAY_NAMES[normalizeDigestWeekday(weekday)] ?? "Monday";
}
