# Publication boundary

This document defines the intended boundary between the future public Cited core and private Cited Cloud operations. It is a planning and safety reference. Nothing in this document authorizes making the repository public.

## Goal

Cited is moving toward an open-core model:

- A public, self-hostable core for citation monitoring, evidence, and workspace workflows
- A private Cited Cloud overlay for hosted operations, billing, outreach, and production infrastructure

The public core should be useful on its own. Cited Cloud remains the commercially hosted product at cited.cc.

## Public core vs private Cited Cloud

| Area | Public core (intended) | Private Cited Cloud |
| --- | --- | --- |
| Product scope | Self-hosted monitoring, evidence, exports, basic roles | Hosted SaaS, billing, lead generation, lifecycle ops |
| Credentials | Bring-your-own provider keys | Production credentials and reconciliation |
| Operations | Public developer docs and self-hosted run paths | Internal runbooks, launch playbooks, admin tooling |
| Data | User-owned workspace data in self-hosted installs | Customer records, hosted analytics, outreach research |

## Intended to become public

- Citation classification
- Citation and domain matching
- Domain verification
- Monitoring engine and provider contract
- DataForSEO adapter using bring-your-own credentials
- Mock provider
- Projects, domains, brands, prompts, and competitors
- Evidence ledger
- Inbox and notebook
- Basic history dashboards
- Basic workspace roles
- Basic export
- Self-hosted deployment
- Self-hosted scheduling
- Public developer documentation

## Must stay private

- Outreach research and prospect data
- Outreach automation scripts
- Personal email addresses and operational defaults
- Private infrastructure identifiers
- Stripe products, prices, billing operations, and reconciliation
- Hosted free-scan lead-generation operations
- Hosted lifecycle campaigns
- Hosted analytics
- Resend inbound forwarding operations
- Learn Domains commercial handoff logic and secrets
- Internal security audits marked private
- Launch playbooks
- Private operational runbooks
- Customer information
- Production credentials
- Production deployment metadata
- Cited Cloud administrative tooling

## Requires sanitization before publication

Even when source code is intended to be public, these areas require review and often removal, redaction, or relocation into a private overlay:

- Git history containing any previously tracked private material
- Tracked MCP configuration with project references
- Internal API routes and cron dispatch endpoints tied to hosted operations
- Billing and Stripe lifecycle implementation details
- Production environment documentation
- Operational runbooks under `docs/runbook-*`
- Launch operations under `launch/`
- Configuration defaults that encode personal or hosted-only contact addresses
- Any file explicitly marked "do not publish"

Sanitization means history rewrite and structural separation, not only deleting files from the latest commit.

## Still undecided

- Final license
- Contributor license agreement
- Final self-hosted authentication implementation
- Exact public/private location of notification templates
- Exact Cloud overlay structure
- Whether basic Slack notifications remain public
- Whether the final repository remains single-package or becomes a workspace later

No license choice is made in Phase 1.

## Publication rules

1. **No repository may become public until the publication readiness check passes.** The check must report zero blocking findings and `publicReleaseBlocked` must be false in `config/publication-policy.json`.
2. **A clean secret scan is necessary but not sufficient.** Automated secret scanning catches obvious credential patterns. It does not prove that history, research data, or operational documents are safe.
3. **Git history must be sanitized, not merely the current working tree.** Files removed in a later commit may still exist in prior commits. Phase 2 handles history sanitation.
4. **cited.cc production behavior must be regression-tested before release.** Open-sourcing must not regress the private hosted product.
5. **The private baseline must remain recoverable.** Private recovery instructions stay outside the public repository.

## Private baseline created in Phase 1

Phase 1 created a recoverable private baseline at commit `1e6c5815c1b9c77e4833c5b5cee7524e5bdcf63f`:

- Annotated tag: `pre-open-source-2026-09-04`
- Backup branch: `archive/pre-open-source-2026-09-04`

These references must remain private. They preserve the full pre-conversion repository state for recovery and comparison.

## Machine-readable enforcement

`config/publication-policy.json` and `scripts/check-publication-readiness.mjs` provide an automated, fail-closed guardrail. Run:

```bash
npm run publication:check
npm run deployment:check
```

Deployment mode architecture is documented in [deployment-modes.md](./deployment-modes.md).

During Phase 1, this command is expected to fail because publication is deliberately blocked and forbidden tracked material still exists. That failure is correct behavior.
