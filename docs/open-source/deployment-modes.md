# Deployment modes

Cited distinguishes **runtime environment** from **product deployment mode**.

| Concept | Variable | Values | Purpose |
| --- | --- | --- | --- |
| Runtime environment | `NODE_ENV` | `development`, `test`, `production` | Build tooling, test runners, production optimizations |
| Deployment mode | `CITED_DEPLOYMENT_MODE` | `cloud`, `self_hosted` | Product capabilities and Cloud-only integrations |

Do not use `NODE_ENV` as a substitute for deployment mode.

## Authoritative configuration

Server-side code resolves deployment mode from:

```bash
CITED_DEPLOYMENT_MODE=cloud|self_hosted
```

Rules:

- **Production:** the variable must be set explicitly. Missing or invalid values fail closed with a configuration error.
- **Development:** when unset, mode defaults to `self_hosted` and emits one concise server-side warning.
- **Test:** defaults deterministically to `self_hosted`. Tests may override mode through the deployment test helpers.

Client-visible UI may read `NEXT_PUBLIC_CITED_DEPLOYMENT_MODE`, but that mirror must stay aligned with the server mode at build time. Server authorization always uses the authoritative server module under `lib/deployment/`.

## Capability matrix

### Available in both modes

| Capability | Notes |
| --- | --- |
| `monitoring` | Citation monitoring engine |
| `citationClassification` | Event typing and classification |
| `evidenceLedger` | Evidence history and snapshots |
| `inbox` | Inbox triage |
| `notebook` | Citation notebook |
| `domainVerification` | DNS TXT verification |
| `basicExport` | Workspace export |
| `workspaceRoles` | Basic roles |
| `internalSchedulerEndpoints` | Monitoring and notification dispatch endpoints |

### Cloud-only

| Capability | Notes |
| --- | --- |
| `stripeBilling` | Hosted Stripe subscriptions |
| `stripeCheckout` | Hosted checkout |
| `stripeCustomerPortal` | Customer portal |
| `stripeWebhook` | Stripe webhook processing |
| `billingReconciliation` | Billing reconcile cron |
| `marketingFreeScan` | Hosted free-scan lead engine |
| `marketingChatbot` | Hosted sales chatbot |
| `hostedAnalytics` | DataFast and Vercel Analytics |
| `hostedLifecycleCampaigns` | Lifecycle email campaigns |
| `hostedInboundEmail` | Resend inbound forwarding |
| `learnDomainsHandoff` | Learn Domains commercial handoff |
| `cloudLaunchFeatures` | Launch and Product Hunt surfaces |

### Planned self-hosted capabilities

These appear in the registry but are **not implemented yet**:

| Capability | Phase |
| --- | --- |
| `selfHostedAuthentication` | Phase 5 (available) |
| `selfHostedBootstrap` | Phase 5 (available) |
| `selfHostedEntitlements` | Phase 6 (available) |
| `portableDatabase` | Phase 7 (available) |
| `selfHostedScheduler` | Phase 10 (available) |
| `selfHostedNotifications` | Phase 10 (available) |
| `selfHostedDocker` | Phase 11 (available) |

Self-hosted Docker Compose is available via `npm run self-host:up`. Phase 11 adds production-grade containers, secure local secret initialization, PostgreSQL 17, automatic migrations, web and worker services, and mock monitoring by default. Self-hosted authentication no longer requires Clerk when `CITED_AUTH_PROVIDER=local`. Self-hosted entitlements no longer require Stripe (Phase 6). Self-hosted PostgreSQL no longer requires a Supabase account when `CITED_DATABASE_PROVIDER=postgres` (Phase 7).

See [self-hosting.md](./self-hosting.md) and [entitlements.md](./entitlements.md).

## Environment validation

`lib/env/index.ts` validates configuration based on deployment mode:

- Cloud-only variables are not required in `self_hosted` mode.
- Partial Cloud billing configuration still fails closed in `cloud` mode when billing is enabled.
- Webhook and cron secret validation is not loosened.

See:

- `.env.example`
- `.env.self-hosted.example`
- `.env.cloud.example`
- `.env.docker.example`

## Build-time behavior

`next.config.ts` enables hosted analytics rewrites only when `CITED_DEPLOYMENT_MODE=cloud` at build time.

If build-time and runtime modes differ, hosted analytics and Cloud UI may disagree with server guards. Keep the mode consistent across build and runtime.

## Security rationale

Deployment guards fail closed:

- Cloud-only routes return generic `404` responses in self-hosted mode.
- Vendor SDKs are not initialized for disabled capabilities.
- Public health and settings payloads expose mode and capability names, not secrets or credential presence.

Run boundary checks:

```bash
npm run deployment:check
```

## Cloud maintainer setup

For private Cited Cloud deployments:

```bash
cp .env.cloud.example .env.local
# set CITED_DEPLOYMENT_MODE=cloud
# configure Clerk, Supabase, Stripe, monitoring, and optional Cloud features
```

This example is for maintainers. It is not a promise that private Cloud services are included in the public repository.

## Self-hosted setup

```bash
cp .env.self-hosted.example .env.local
# defaults to CITED_DEPLOYMENT_MODE=self_hosted
```

Expect hosted billing, analytics, chatbot, free-scan, inbound mail, and Learn Domains handoffs to remain disabled until their phases complete.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Startup error about deployment mode in production | Missing `CITED_DEPLOYMENT_MODE` | Set `cloud` or `self_hosted` explicitly |
| Checkout or billing routes return 404 | Running in `self_hosted` mode | Expected. Use Cloud mode only for hosted billing |
| Analytics scripts missing | Self-hosted build or runtime mode | Expected in self-hosted mode |
| Cloud features disabled despite env flags | Mode is `self_hosted` | Set `CITED_DEPLOYMENT_MODE=cloud` for Cloud deployments |

## Related docs

- [Publication boundary](./publication-boundary.md)
- [Local development](../local-development.md)
- [Production environment](../production-env.md)
