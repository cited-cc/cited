# Plan entitlements

Source of truth: `lib/billing/entitlements.ts` + `lib/billing/plans.ts`.

Checks: `lib/entitlements/checks.ts`. Enforcement helpers: `lib/entitlements/enforce.ts`.

## Enforcement points

- Domains / prompts / onboarding
- Monitor activation and dispatcher
- Scan execution eligibility
- Slack delivery (plan must include Slack)
- History window on citation detail (content gated, not deleted)
- Notebook / annotation create (billing active)

## Over-limit / downgrade

Do not delete data. Block excess active monitors with `pause_reason=plan_limit`. Show impact before downgrade confirmation.

## History

Founder 90 days, Growth 365 days, Pro expanded (`null`). Older evidence remains stored; UI withholds body content and shows upgrade copy.
