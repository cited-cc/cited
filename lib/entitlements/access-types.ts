import type { PlanKey, WorkspaceStatus } from "@/types/product";

/** Legacy billing status column compatibility for existing databases. */
export type BillingStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "unpaid"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "paused"
  | "suspended"
  | "unknown";

export function isPaidPlanKey(planKey: PlanKey): boolean {
  return (
    planKey === "founder" ||
    planKey === "growth" ||
    planKey === "pro" ||
    planKey === "portfolio" ||
    planKey === "enterprise"
  );
}

export function isPaidWorkspaceStatus(status: WorkspaceStatus): boolean {
  return status === "active" || status === "trialing" || status === "past_due";
}
