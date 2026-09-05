import type { BillingStatus } from "@/lib/entitlements/access-types";
import type { PlanKey, WorkspaceStatus } from "@/types/product";

import type { EntitlementSnapshot, EntitlementSource } from "@/lib/entitlements/types";

export type WorkspaceEntitlementInput = Readonly<{
  workspaceId: string;
  planKey: PlanKey;
  status: WorkspaceStatus;
  billingStatus?: BillingStatus | null;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string | null;
  billingGraceUntil?: string | null;
  portfolioExtraDomains?: number | null;
  now?: Date;
}>;

export interface EntitlementProvider {
  readonly source: EntitlementSource;
  resolve(input: WorkspaceEntitlementInput): EntitlementSnapshot;
}
