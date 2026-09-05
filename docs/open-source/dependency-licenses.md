# Dependency licenses

This document explains how Cited inventories dependency licenses. It is not legal
advice and does not determine license compatibility for your deployment.

## Scope

- **Direct dependencies** listed in `package.json` are scanned from
  `package-lock.json`.
- **Transitive dependencies** are not fully analyzed by the Phase 3 checker.
- **Native binaries** (for example, packages such as `sharp` that bundle
  libvips) may carry additional distribution obligations. Review those packages
  before shipping binaries or container images.
- **Container image licensing** will be reviewed again during the Docker phase.

## Running the inventory

```bash
npm run license:check
```

The command reads the local lockfile only. It does not upload project data.

## How results are classified

The checker reports each direct dependency's declared license from the lockfile
and assigns a review category:

| Category | Meaning |
| --- | --- |
| `permissive` | Common permissive licenses (for example MIT, Apache-2.0, BSD, ISC). Still requires human review for production distribution. |
| `copyleft-review` | GPL-family or AGPL-family licenses that need manual compatibility review. |
| `review-required` | Unknown, missing, custom, or source-available licenses. |
| `disallowed` | SSPL, BSL, and other explicitly blocked categories unless allowlisted. |

The tool does **not** automatically declare legal compatibility with Cited's
AGPL-3.0-only license.

## Allowlist

A minimal allowlist lives in `config/license-allowlist.json`. Entries must
include a written reason and are intended for exceptional cases only.

## Cited's own license

The checker does not fail solely because Cited itself is licensed under
AGPL-3.0-only.

## Manual review expectations

Before publication or binary distribution:

1. Resolve every `review-required`, `copyleft-review`, and `disallowed` finding.
2. Inspect native modules and their system libraries.
3. Re-run the inventory after dependency changes.

## Limitations

If the lockfile lacks a license field for a package, the checker reports
`missing` and fails until the package is verified manually or allowlisted with
documented rationale.

Do not treat passing permissive classifications as a legal clearance.
