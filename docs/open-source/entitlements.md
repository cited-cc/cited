# Entitlements and billing separation

Phase 6 separates **deployment capabilities**, **product entitlements**, and **operational limits**. Payment state and product authorization are different concepts.

## Concepts

| Concept | Purpose |
| --- | --- |
| Deployment capabilities | Whether a feature exists in this deployment mode (Cloud vs self-hosted) |
| Entitlements | What an authenticated workspace member may use right now |
| Operational limits | Administrator-configured safety caps for self-hosted installs |

Core application code consumes `EntitlementSnapshot` from `lib/entitlements/`. Neutral modules must not inspect Stripe subscription fields directly.

## Cloud (Stripe-backed)

Cloud mode uses the `stripe` entitlement source:

- Commercial plans: Founder, Growth, Pro, Portfolio, internal free, enterprise
- Stripe remains the billing source of truth
- Checkout, portal, webhooks, grace periods, cancellation, and reconciliation behave as before
- Plan limits, history windows, surface availability, and member caps come from `PLAN_ENTITLEMENTS`
- Past-due grace pauses monitoring while preserving evidence
- Canceled workspaces become read-only after the billing period ends
- Excess monitors are paused when plan limits are exceeded

Cloud billing routes are gated by deployment capabilities and return 404 in self-hosted mode.

## Self-hosted (configuration-backed)

Self-hosted mode uses the `self_hosted` entitlement source:

- No Stripe account, price IDs, checkout, subscription, or billing status required
- Core product is usable after successful authentication and workspace membership
- Bootstrap creates the first owner workspace without Stripe records
- Default limits are **unlimited** (`null`) where Cloud limits exist only for commercial packaging
- Optional administrator safety limits protect infrastructure spend

### Default self-hosted access

After bootstrap, workspaces receive:

- Monitoring (subject to provider readiness)
- Domains, prompts, competitors, evidence, inbox, notebook
- Basic teams and export
- Supported AI surfaces enabled in the monitoring engine
- Full retained history unless an administrator sets a history cap

Not enabled in this phase:

- Slack alerts (Phase 10: self-hosted; cloud plan gating may still apply)
- Hosted lifecycle campaigns
- Agency portfolio Cloud services
- Portable scheduler and notification delivery (later phases)

### Administrator safety limits

Optional environment variables accept a positive integer or `unlimited`:

| Variable | Purpose |
| --- | --- |
| `CITED_SELF_HOSTED_MAX_USERS` | Workspace member cap |
| `CITED_SELF_HOSTED_MAX_DOMAINS` | Verified domain cap |
| `CITED_SELF_HOSTED_MAX_MONITORS` | Active monitor configuration cap |
| `CITED_SELF_HOSTED_MAX_PROMPTS` | Monitored prompt cap |
| `CITED_SELF_HOSTED_HISTORY_DAYS` | Evidence visibility window |

Invalid values (zero, negative, malformed, or unreasonably large) fail closed at parse time. Limit errors reference the configuration variable, not plan upgrades.

## Workspace access states

### Cloud

- Active / trialing
- Past due within grace
- Billing blocked
- Canceled / read-only
- Onboarding incomplete

### Self-hosted

- Bootstrap required
- Authentication required
- Workspace setup / onboarding
- Active
- Disabled by administrator (`status=suspended`)
- Configuration incomplete (invalid limit env)

Self-hosted users are never redirected to checkout or blocked for missing Stripe data.

## History and retention

- **Cloud:** plan history windows may hide older evidence in the UI; stored evidence remains
- **Self-hosted:** no Cloud plan history withholding by default; administrator retention may apply
- Physical purge and portable scheduling belong to later operational phases

## Monitoring authorization

Use `canRunMonitoring` (not `canRunPaidMonitoring`) in core monitoring paths. Cloud considers subscription state; self-hosted considers workspace access and configured limits.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Self-hosted user sees checkout | `CITED_DEPLOYMENT_MODE=self_hosted` and `NEXT_PUBLIC_CITED_DEPLOYMENT_MODE=self_hosted` |
| Monitoring blocked after bootstrap | `MONITORING_ENABLED`, provider credentials, domain verification |
| Limit reached unexpectedly | Self-hosted safety limit env vars |
| Cloud billing 404 in self-hosted | Expected; billing routes are Cloud-only |
| Slack unavailable | Expected on some cloud plans; self-hosted includes Slack webhooks |

Run boundary checks:

```bash
npm run billing:check
npm run deployment:check
```
