import { NextResponse } from "next/server";

import { getPublicDatabaseHealthPayload, getDatabaseHealthSnapshot } from "@/lib/db/health";
import { getPublicDeploymentStatusForHealth } from "@/lib/deployment/status";
import { getPublicProviderHealthPayload } from "@/lib/providers/status";

export async function GET() {
  const deployment = getPublicDeploymentStatusForHealth();
  const database = getPublicDatabaseHealthPayload(await getDatabaseHealthSnapshot());
  const provider = getPublicProviderHealthPayload();

  return NextResponse.json({
    ...deployment,
    ...database,
    providerReady: provider.providerReady,
    monitoringProvider: provider.providerId,
    mockMonitoringProvider: provider.mockMode,
    timestamp: new Date().toISOString(),
  });
}
