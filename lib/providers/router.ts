import type { AiSurfaceKey } from "@/types/product";

import {
  assertProviderSupportsSurface,
  getMonitoringProviderForSurface,
  resolveProviderForSurface,
} from "@/lib/providers/registry";
import {
  resolveDefaultMonitoringProviderId,
  parseSurfaceProviderMap,
} from "@/lib/providers/config";
import type { MonitoringProviderId } from "@/lib/providers/types";

export function resolveMonitoringProviderIdForSurface(
  surface: AiSurfaceKey,
): MonitoringProviderId {
  return resolveProviderForSurface(surface);
}

export function validateProviderRouting(): {
  defaultProviderId: MonitoringProviderId;
  surfaceMap: Partial<Record<AiSurfaceKey, MonitoringProviderId>>;
  routes: Array<{ surface: AiSurfaceKey; providerId: MonitoringProviderId }>;
} {
  const defaultProviderId = resolveDefaultMonitoringProviderId();
  const surfaceMap = parseSurfaceProviderMap();
  const routes = (Object.keys(surfaceMap).length > 0
    ? Object.entries(surfaceMap)
    : []
  ).map(([surface, providerId]) => ({
    surface: surface as AiSurfaceKey,
    providerId: providerId as MonitoringProviderId,
  }));

  for (const route of routes) {
    assertProviderSupportsSurface(route.providerId, route.surface);
  }

  return {
    defaultProviderId,
    surfaceMap,
    routes,
  };
}

export { getMonitoringProviderForSurface };
