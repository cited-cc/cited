# Roadmap

This roadmap lists **directional** public milestones for the Cited open-source
core. Items are goals, not promises, and may change without notice.

Publication remains blocked until readiness checks and human approval complete.

## Milestones

### Self-hosted deployment mode

**In progress (Phase 4 foundation complete).** Central deployment-mode architecture,
capability registry, route guards, and environment examples are in place. Full
self-hosting still requires authentication (Phase 5), entitlements (Phase 6), and
database portability (Phase 7).

### Authentication portability

Reduce hard dependencies on a single auth vendor where practical for self-hosted
operators.

### Billing separation

**Phase 6 complete in cited-public.** Cloud Stripe billing is isolated from
self-hosted entitlements. Self-hosted core access no longer requires checkout or
Stripe variables. Hosted billing lifecycle remains Cloud-only.

### Provider adapters

Expand and harden monitoring provider adapters with bring-your-own credentials.

### Docker installation

**Phase 11 complete in cited-public.** Local Docker Compose startup with secure secret initialization, PostgreSQL 17, migrations, web, worker, and mock monitoring defaults. Public image publication remains blocked.

Container images and compose-oriented installation flows with licensing review
for bundled dependencies.

### Monitoring correctness

Improve scheduling, evidence capture, and classification reliability across
supported surfaces.

### CI and security automation

Publication readiness, dependency license inventory, secret scanning, and release
gates suitable for community contributions.

### Documentation

Self-hosting guides, architecture references, and contributor onboarding aligned
with the public/private boundary.

### First stable release

A tagged stable release with supported upgrade expectations and security
reporting for supported versions.

## Non-goals for this document

- Private Cited Cloud commercial plans
- Outreach, lifecycle, or hosted-only operations detail
- Guaranteed delivery dates

See [docs/open-source/publication-boundary.md](docs/open-source/publication-boundary.md)
for scope boundaries.
