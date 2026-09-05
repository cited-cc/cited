# Branch Protection Policy

Configure these settings in Phase 16 after the repository is hosted on GitHub. Do not apply them while publication remains blocked and no remote exists.

## Required settings

- Require pull requests before merging to `main`
- Require branches to be up to date before merging
- Require conversation resolution
- Block force pushes to `main`
- Block deletion of `main`
- Require DCO sign-off (`DCO.md`)
- Do not require signed commits unless maintainers can support that consistently across all contributors
- Do not require an unavailable review team

## Required status checks

Enable these exact check names from the CI and Security workflows:

### CI

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

### Security

- Secret scan
- Security baseline
- Dependency audit
- License check
- SBOM generation
- CodeQL
- Docker vulnerability scan
- Workflow security

## Emergency maintainer path

Maintainers may bypass required checks only for documented production incidents with post-incident review. Record:

- Incident summary
- Reason bypass was necessary
- Follow-up PR that restores green CI
- Approver name and timestamp

Bypass use must remain rare and accountable.

## Not required before Phase 16

- Remote branch protection rules
- Required review count greater than zero when no review team exists yet
- Signed commits
- Rulesets imported from private infrastructure
