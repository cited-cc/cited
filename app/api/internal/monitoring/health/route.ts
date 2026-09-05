import { NextResponse } from "next/server";

import { getMonitoringHealthSnapshot } from "@/lib/monitoring/health";
import { getMonitoringCronSecret, getOptionalServerEnv } from "@/lib/env";
import { requireCronAuthorization } from "@/lib/security/cron";

export const runtime = "nodejs";

/**
 * Protected internal monitoring health.
 * Public /api/health remains minimal.
 */
export async function GET(request: Request) {
  const env = getOptionalServerEnv();
  const secret = getMonitoringCronSecret(env);
  const authHeader = request.headers.get("authorization");

  if (!requireCronAuthorization(authHeader, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await getMonitoringHealthSnapshot();
  return NextResponse.json({
    ok: true,
    monitoringEnabled: snapshot.monitoringEnabled,
    providerConfigured: snapshot.providerConfigured,
    provider: snapshot.provider,
    queuedRunCount: snapshot.queuedRunCount,
    runningRunCount: snapshot.runningRunCount,
    failedRunCountRecent: snapshot.failedRunCountRecent,
    oldestPendingRunAgeSeconds: snapshot.oldestPendingRunAgeSeconds,
    timestamp: new Date().toISOString(),
  });
}
