# Continuous Integration

Phase 14 adds fork-safe GitHub Actions workflows. Workflows are validated locally with `npm run workflow:check` and orchestrated with `npm run ci:check`.

Publication remains blocked until Phase 16 release approval. Remote workflow execution is a Phase 16 requirement because no Git remote exists yet.

## Workflows

| Workflow | File | Purpose |
|----------|------|---------|
| CI | `.github/workflows/ci.yml` | Quality gates, integration, build, E2E, Docker |
| Security | `.github/workflows/security.yml` | Secret scan, baseline, audit, SBOM, CodeQL, Trivy |

## CI jobs and check names

Expected GitHub check names after hosting:

- Repository policy
- Lint
- Typecheck
- Unit tests
- Coverage
- PostgreSQL integration
- Production build
- Browser E2E
- Docker build
- Compose smoke

Security workflow checks:

- Secret scan
- Security baseline
- Dependency audit
- License check
- SBOM generation
- CodeQL
- Docker vulnerability scan
- Workflow security

## Fork safety

- Top-level `permissions: contents: read`
- No `pull_request_target`
- No private secrets required for PR validation
- `persist-credentials: false` on checkout
- Actions pinned to immutable full SHAs
- Concurrency cancels superseded runs
- Failure artifacts only, retained for three days
- No deployment, image publication, or package publishing steps

## Local parity

`npm run ci:check` runs the deterministic local equivalent:

- Always runs lint, typecheck, unit, security, boundary, coverage, security scripts, boundary scripts, docs integrity, and build
- Runs PostgreSQL integration and migration CI when `DATABASE_URL` is configured
- Runs E2E when `CITED_E2E_ENABLED=true` and PostgreSQL is available
- Runs Docker smoke when Docker is available
- Reports skipped stages instead of silently omitting them

## Failure artifact handling

- Playwright uploads `test-results/` and `playwright-report/` on failure only
- SBOM uploads `.cited/sbom/sbom.json` with short retention
- Artifacts must not contain secrets, bootstrap tokens, or session cookies

## Updating pinned actions

1. Choose the upstream release tag from the action repository.
2. Resolve the immutable commit SHA from GitHub.
3. Update the workflow file with `uses: org/action@<sha> # vX.Y.Z`.
4. Record the change in `docs/maintainers/actions-supply-chain.md`.
5. Run `npm run workflow:check`.

## Reviewing dependency updates

Dependabot opens weekly PRs after the repository is hosted. Configuration is in `.github/dependabot.yml`:

- npm patch/minor grouped conservatively
- major updates remain separate
- no auto-merge

Review dependency PRs with:

```bash
npm ci
npm run ci:check
npm run security:audit
npm run license:check
```

## Dependabot activation

Dependabot becomes active only after the repository is hosted on GitHub with a configured remote.
