# Cited

Cited is the open-source citation monitoring platform. Track when AI assistants
mention, recommend, and cite your brand across the prompts that matter.

This repository is a **pre-release open-source candidate** being prepared for
self-hosting. Publication remains blocked until readiness checks and human
approval complete.

**Hosted [Cited Cloud](https://cited.cc)** at cited.cc remains a separate,
privately operated service.

## What Cited monitors

Cited monitors **selected prompts and supported AI surfaces** you configure. It
does not claim to capture every AI mention everywhere on the internet.

When your verified domain appears in a monitored response, Cited records
evidence and alerts your workspace.

## Status

- Sanitized public candidate with fresh Git history
- AGPL-3.0-only licensed source (see [LICENSE](LICENSE))
- Self-hosting and Docker documentation: **available** (`npm run self-host:up`)
- One-command Docker Compose startup for local installations
- Not yet announced or published for general production self-hosting

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Provider-neutral authentication: Clerk in cloud mode, local email/password in self-hosted mode
- Provider-neutral database: Supabase for Cited Cloud, direct PostgreSQL 17 for self-hosted
- Optional: Stripe, Resend, DataForSEO (bring-your-own credentials)

## Quick start (self-hosted Docker)

```bash
npm ci
npm run self-host:up
```

See [docs/open-source/self-hosting.md](docs/open-source/self-hosting.md).

## Local development

```bash
cp .env.self-hosted.example .env.local
# defaults to CITED_DEPLOYMENT_MODE=self_hosted and CITED_DATABASE_PROVIDER=postgres
npm ci
npm run db:migrate
npm run db:seed            # optional fictional demo fixtures
npm run dev
```

See [docs/local-development.md](docs/local-development.md) for full setup.

## Deployment modes

Cited uses one authoritative server variable:

```bash
CITED_DEPLOYMENT_MODE=cloud|self_hosted
```

- `cloud`: managed Cited Cloud capabilities (Stripe, hosted analytics, marketing automation)
- `self_hosted`: open-source deployment with Cloud-only services disabled

`NODE_ENV` remains separate (`development`, `test`, `production`). See
[docs/open-source/deployment-modes.md](docs/open-source/deployment-modes.md).

## Documentation

- [Architecture](docs/architecture.md)
- [Local development](docs/local-development.md)
- [Publication boundary](docs/open-source/publication-boundary.md)
- [Deployment modes](docs/open-source/deployment-modes.md)
- [Self-hosting](docs/open-source/self-hosting.md)
- [Docker architecture](docs/open-source/docker.md)
- [Licensing overview](docs/open-source/licensing.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Roadmap](ROADMAP.md)

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npm run security:scan
npm run content:check
npm run seo:check
npm run publication:check
npm run docker:check
npm run self-host:doctor
npm run deployment:check
npm run license:check
```

## License

Cited public source is licensed under [AGPL-3.0-only](LICENSE).

- You may inspect, modify, self-host, and use the software commercially under
  AGPL terms.
- Network operators who modify Cited may have source-disclosure obligations.
  Read LICENSE and [docs/open-source/licensing.md](docs/open-source/licensing.md).
- Alternative commercial licensing may be offered in the future for organizations
  that cannot comply with AGPL requirements.

Trademarks are covered separately in [TRADEMARKS.md](TRADEMARKS.md).

This is not legal advice. Consult qualified counsel for your deployment.

## Contributing

Contributions require DCO signoff. See [CONTRIBUTING.md](CONTRIBUTING.md) and
[DCO.md](DCO.md).

## Security

Report vulnerabilities privately per [SECURITY.md](SECURITY.md). Do not open
public issues for security reports.
