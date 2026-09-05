# Contributing to Cited

Thank you for your interest in contributing to Cited.

## Project status

This repository is a **sanitized pre-release open-source candidate**. Publication
remains blocked until Phase 16 release approval.

See [docs/open-source/publication-boundary.md](docs/open-source/publication-boundary.md)
for the public/private boundary.

## Prerequisites

- **Node.js 22+**
- **npm** (required package manager)
- **Docker Compose v2** for self-hosted testing

## Setup (self-hosted)

```bash
npm ci
npm run self-host:up
npm run self-host:token   # retrieve bootstrap token for /setup
```

For local development without Docker:

```bash
cp .env.self-hosted.example .env.local
npm ci
npm run db:migrate
npm run db:seed           # optional fictional demo fixtures
npm run dev
```

See [docs/getting-started/manual-installation.md](docs/getting-started/manual-installation.md).

## Development commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run ci:check
npm run docs:check
npm run publication:check
```

## Documentation changes

When changing user-visible behavior or configuration:

1. Update relevant docs under `docs/`
2. Run `npm run docs:check`, `npm run docs:links`, and `npm run env:drift`
3. Regenerate screenshots when UI changes affect committed assets: `npm run docs:screenshots`

## Contribution expectations

### Scope and pull requests

- Keep pull requests focused.
- Explain what problem a change solves and how it was verified.
- Add or update tests for behavioral changes.

### Data and secrets

- Do **not** include customer data, credentials, or production values.
- Use fictional example domains (`*.example`) in fixtures.
- Do not copy private Cited Cloud code or operational data into this repository.

### Licensing

Contributions are licensed under **AGPL-3.0-only**. See [LICENSE](LICENSE).

### Developer Certificate of Origin

Every commit must include DCO signoff:

```bash
git commit -s -m "Describe your change"
```

See [DCO.md](DCO.md).

## Security reports

Follow [SECURITY.md](SECURITY.md). Do not open public issues for vulnerabilities.

## Code of conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Governance

See [GOVERNANCE.md](GOVERNANCE.md).

## Questions

Until GitHub Discussions is enabled after publication, use https://cited.cc/contact
for non-security questions.
