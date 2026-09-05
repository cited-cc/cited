import { NextResponse } from "next/server";

import {
  getMonitoringCronSecret,
  getNotificationsCronSecret,
  getOptionalServerEnv,
} from "@/lib/env";
import { runBackgroundJob } from "@/lib/jobs/runner";
import type { BackgroundJobId } from "@/lib/jobs/types";
import { JobNotAvailableError } from "@/lib/jobs/errors";
import { requireCronAuthorization } from "@/lib/security/cron";
import { logger } from "@/lib/security/logger";

type CronGuard = () => NextResponse | null;

type CronJobRouteOptions = Readonly<{
  jobId: BackgroundJobId;
  guard?: CronGuard;
  resolveSecret?: () => string | undefined;
  unauthorizedEvent: string;
  failedEvent: string;
}>;

function defaultSecretForJob(jobId: BackgroundJobId): string | undefined {
  const env = getOptionalServerEnv();
  switch (jobId) {
    case "monitoring.dispatch":
      return getMonitoringCronSecret(env);
    case "notifications.dispatch":
    case "notifications.digests":
      return getNotificationsCronSecret(env);
    case "security.retention":
      return getMonitoringCronSecret(env);
    default: {
      const _exhaustive: never = jobId;
      return _exhaustive;
    }
  }
}

export async function handleCronJobRoute(
  request: Request,
  options: CronJobRouteOptions,
): Promise<NextResponse> {
  const blocked = options.guard?.();
  if (blocked) {
    return blocked;
  }

  const secret = options.resolveSecret?.() ?? defaultSecretForJob(options.jobId);
  const authHeader = request.headers.get("authorization");

  if (!requireCronAuthorization(authHeader, secret)) {
    logger.warn("Cron job unauthorized", {
      event: options.unauthorizedEvent,
      jobId: options.jobId,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runBackgroundJob({
      jobId: options.jobId,
      transport: "vercel_cron",
    });
    return NextResponse.json({
      ok: result.ok,
      jobId: options.jobId,
      durationMs: result.durationMs,
      ...result.summary,
    });
  } catch (error) {
    if (error instanceof JobNotAvailableError) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    logger.error("Cron job failed", {
      event: options.failedEvent,
      jobId: options.jobId,
    });
    return NextResponse.json({ error: "Dispatch failed" }, { status: 500 });
  }
}
