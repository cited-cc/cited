# Contributing to Cited

Thank you for your interest in contributing to Cited.

## Project status

This repository is a **sanitized pre-release open-source candidate**. It is being
prepared for future self-hosting and public collaboration.

Publication remains blocked. Do not assume this repository is public, announced,
or supported for production self-hosting yet.

See [docs/open-source/publication-boundary.md](docs/open-source/publication-boundary.md)
for the public/private boundary.

## Prerequisites

- **Node.js 20+** (22 recommended). See [docs/local-development.md](docs/local-development.md).
- **npm** (required package manager for this repository)
- Clerk and Supabase credentials for full local development

## Setup

```bash
cp .env.example .env.local
# Fill Clerk and Supabase values
npm ci
npx supabase db push
npm run seed   # optional demo fixtures
```

## Development commands

```bash
npm run dev          # local development server
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm run test         # unit tests (Vitest)
npm run build        # production build
npm run security:scan
npm run content:check
npm run seo:check
npm run publication:check
npm run license:check
```

Docker and full self-hosting documentation are **not complete** in this phase.
Expect those in later release phases.

## Contribution expectations

### Scope and pull requests

- Keep pull requests focused. Prefer small, reviewable changes over large mixed diffs.
- Explain what problem a change solves and how it was verified.
- Update documentation when behavior, configuration, or user-visible flows change.
- Add or update tests for behavioral changes.

### Data and secrets

- Do **not** include customer data, prospect data, credentials, or production values.
- Use fake values in fixtures and examples.
- Do not copy private Cited Cloud code, runbooks, or operational data into this repository.

### Licensing

Contributions are licensed under **AGPL-3.0-only**, the same license as the
project. See [LICENSE](LICENSE) and [docs/open-source/licensing.md](docs/open-source/licensing.md).

### Developer Certificate of Origin

Every commit must include DCO signoff:

```bash
git commit -s -m "Describe your change"
```

See [DCO.md](DCO.md) for the full DCO text and instructions.

Signoff certifies you have the right to submit the contribution. It is not the
same as cryptographic Git commit signing.

**Legal review note:** DCO signoff does not grant the project rights to
relicense contributions under a proprietary commercial license. If proprietary
relicensing is ever required, a separate CLA would need legal review before
acceptance.

## Security reports

Do not report security vulnerabilities in public issues.

Follow [SECURITY.md](SECURITY.md) for private reporting instructions.

## Code of conduct

Participants must follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Governance

See [GOVERNANCE.md](GOVERNANCE.md) for maintainer-led decision making.

## Questions

Until GitHub Discussions is enabled after publication, use https://cited.cc/contact
for questions that are not security issues.
