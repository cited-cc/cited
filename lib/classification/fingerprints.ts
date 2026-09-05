import { buildEventFingerprint } from "@/lib/monitoring/hash";
import type { AiSurfaceKey, CitationEventType } from "@/types/product";

export function classificationFingerprint(input: {
  workspaceId: string;
  domainId: string;
  monitorConfigurationId: string;
  aiSurface: AiSurfaceKey;
  eventType: CitationEventType;
  identityKey: string;
}): string {
  return buildEventFingerprint(input);
}

export { buildEventFingerprint, excerptAroundMatch } from "@/lib/monitoring/hash";
