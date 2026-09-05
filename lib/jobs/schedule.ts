import type { JobSchedule } from "@/lib/jobs/types";

/**
 * Derive a portable worker interval from common Vercel cron patterns.
 * Workers use intervalMs as a minimum spacing guard between runs.
 */
export function cronToIntervalMs(cron: string): number {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    return 60_000;
  }

  const [minute, hour] = parts;

  if (minute.startsWith("*/")) {
    const step = Number(minute.slice(2));
    if (Number.isFinite(step) && step > 0) {
      return step * 60_000;
    }
  }

  if (minute === "0" && hour === "6") {
    return 24 * 60 * 60_000;
  }

  if (hour === "*") {
    return 60 * 60_000;
  }

  return 60_000;
}

export function defineJobSchedule(cron: string): JobSchedule {
  return Object.freeze({
    cron,
    intervalMs: cronToIntervalMs(cron),
  });
}

export function isJobDue(
  schedule: JobSchedule,
  lastRunAt: Date | null,
  now: Date,
): boolean {
  if (!lastRunAt) {
    return true;
  }
  return now.getTime() - lastRunAt.getTime() >= schedule.intervalMs;
}
