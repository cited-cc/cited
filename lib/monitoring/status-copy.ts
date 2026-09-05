/**
 * User-facing copy for monitor activation status and pause reasons.
 */
export function pauseReasonLabel(
  reason: string | null | undefined,
): string | null {
  if (!reason) return null;
  switch (reason) {
    case "user_paused":
      return "Paused by you.";
    case "usage_safety_limit_reached":
      return "Paused at the usage safety limit for this billing period.";
    case "unsupported_surface":
      return "This AI surface is not available for monitoring.";
    case "repeated_failures":
      return "Paused after repeated monitoring failures.";
    case "plan_capacity_exceeded":
      return "This monitor exceeds your plan monitoring capacity. Reduce prompts or surfaces, or upgrade your plan.";
    case "max_active_monitors":
      return "Active monitor limit reached for this plan.";
    case "plan_limit":
      return "This monitor exceeds your plan limit after a plan change.";
    case "billing_inactive":
      return "Monitoring is paused because billing is inactive.";
    default:
      return "Monitoring is paused.";
  }
}

/** Block reasons that activation can clear on retry. */
export const RECOVERABLE_BLOCK_REASONS = new Set([
  "plan_capacity_exceeded",
  "max_active_monitors",
  "unsupported_surface",
]);

export function isRecoverableBlockReason(
  reason: string | null | undefined,
): boolean {
  return Boolean(reason && RECOVERABLE_BLOCK_REASONS.has(reason));
}
