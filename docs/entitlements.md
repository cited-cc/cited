# Entitlements

Server-side plan enforcement lives in:

- `lib/billing/plans.ts` / `lib/billing/entitlements.ts` (limits + features)
- `lib/entitlements/checks.ts` (typed checks)
- `lib/entitlements/enforce.ts` (post-change blocking)

## Result shape

```ts
type EntitlementResult =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | "billing_inactive"
        | "plan_limit_reached"
        | "feature_not_in_plan"
        | "usage_safety_limit_reached"
        | "workspace_suspended"
        | "requires_upgrade"
        | "unknown_billing_state";
      safeMessage: string;
      requiredPlan?: PlanKey;
      currentUsage?: number;
      limit?: number;
    };
```

## Must check server-side

- add domain / verify domain
- add prompt / activate monitor
- select AI surface / cadence / location
- invite members
- enable Slack / competitor watch
- history window / exports
- run scan / send notification

UI-disabled controls are never the only gate.

## Billing inactive behavior

Canceled / past-due (after grace) workspaces:

- cannot schedule new paid scans
- cannot create expensive resources
- retain historical evidence (never deleted on downgrade/cancel)
