# Changelog

All notable changes to the public Cited open-source repository will be documented
in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Nothing yet.

## [0.1.0] - 2025-09-05

### Added

- Open-source citation monitoring for configured prompts and supported AI surfaces.
- Self-hosted Docker Compose deployment with web, worker, and PostgreSQL 17.
- Local authentication with first-owner bootstrap and secure secret generation.
- PostgreSQL-backed persistence with migration tooling and role separation.
- DataForSEO bring-your-own adapter for live monitoring with operator credentials.
- Mock provider with clearly labeled fictional demo data for offline evaluation.
- Competitor tracking and missed-opportunity detection.
- Evidence ledger with exports and notebook notes.
- Inbox review workflows for citation events.
- Portable background worker for scheduled scan runs.
- Optional SMTP and Slack notification adapters (disabled by default).
- Documentation, CI quality gates, security baseline, and publication readiness checks.
- AGPL-3.0-only licensing with contributor policies and security reporting path.

### Security

- Secret scanning, dependency audit, SBOM generation, and container vulnerability scanning.
- Non-root container runtime, read-only root filesystem defaults in Compose, and no-new-privileges.
- Notifications and external email delivery disabled by default.

### Known limitations

- Mock mode does not reflect real AI answers; live monitoring requires a configured provider.
- Surface availability depends on the selected provider adapter and operator credentials.
- This release is an initial community edition, not a production guarantee or v1.0 milestone.
- Managed hosting remains available separately at [cited.cc](https://cited.cc).

[Unreleased]: https://github.com/cited-cc/cited/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/cited-cc/cited/releases/tag/v0.1.0
