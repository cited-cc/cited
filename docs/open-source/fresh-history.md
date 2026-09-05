# Fresh Git history

This repository was prepared from a private production codebase as part of Cited's open-core conversion.

## Why history starts here

Fresh Git history was intentionally used so private operational data, credentials, outreach research, and hosted infrastructure detail from the private codebase never enter the public record.

The public project begins from its first sanitized commit in this repository. Earlier private commits, branches, tags, and remotes are not part of this history and must not be imported.

## What does not belong here

- Customer or prospect personal data
- Outreach research exports or campaign artifacts
- Production credentials or secret values
- Private infrastructure identifiers
- Private Git history from the production repository

## Contributor expectations

- Do not attempt to merge, cherry-pick, or graft history from the private production repository.
- Do not add files marked for private use only.
- Report security concerns through the process documented in [SECURITY.md](../../SECURITY.md).

## Publication status

This repository remains blocked from public release until publication readiness validation, licensing, and human approval are complete. See `config/publication-policy.json` and `npm run publication:check`.
