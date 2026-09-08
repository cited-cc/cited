# GitHub Actions Supply Chain

Every external action in community workflows is pinned to a verified full commit SHA. Floating tags, `main`, and `master` references are forbidden.

## Inventory

| Action | Repository | Version | SHA | Purpose | Permissions |
|--------|------------|---------|-----|---------|-------------|
| checkout | actions/checkout | v4.2.2 | `11bd71901bbe5b1630ceea73d27597364c9af683` | Clone repository | contents: read |
| setup-node | actions/setup-node | v7.0.0 | `820762786026740c76f36085b0efc47a31fe5020` | Install Node.js 22 | contents: read |
| cache | actions/cache | v4.2.0 | `1bd1e32a3bdc45362d1e726936510720a7c30a57` | npm cache | contents: read |
| upload-artifact | actions/upload-artifact | v7.0.1 | `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` | Failure artifacts and SBOM | contents: read |
| login-action | docker/login-action | v4.6.0 | `dbcb813823bdd20940b903addbd779551569679f` | GHCR login | contents: read, packages: write |
| metadata-action | docker/metadata-action | v6.2.0 | `dc802804100637a589fabce1cb79ff13a1411302` | Container image tags | contents: read |
| build-push-action | docker/build-push-action | v7.3.0 | `53b7df96c91f9c12dcc8a07bcb9ccacbed38856a` | Build and push container | contents: read, packages: write |
| action-gh-release | softprops/action-gh-release | v3.0.3 | `efb35369e0ad2afab669f228072c1b0d510eae64` | Publish GitHub Release | contents: write |
| codeql-init | github/codeql-action/init | v3.28.0 | `48ab28a6f5dbc2a99bf1e0131198dd8f1df78169` | Initialize CodeQL | contents: read, security-events: write |
| codeql-analyze | github/codeql-action/analyze | v3.28.0 | `48ab28a6f5dbc2a99bf1e0131198dd8f1df78169` | Upload CodeQL results | contents: read, security-events: write |
| trivy-action | aquasecurity/trivy-action | v0.36.0 | `ed142fd0673e97e23eac54620cfb913e5ce36c25` | Docker image vulnerability scan | contents: read |

## Verification source

Resolve SHAs from the upstream action repository tags on GitHub:

```bash
gh api repos/actions/checkout/git/ref/tags/v4.2.2 --jq '.object.sha'
```

For annotated tags, dereference to the commit SHA before updating workflows.

## Update procedure

1. Select the new upstream release tag.
2. Resolve and record the commit SHA in this document.
3. Update workflow files with the SHA and a comment containing the human-readable tag.
4. Run `npm run workflow:check`.
5. Merge only after CI and Security workflows pass on GitHub.

## Policy

- Prefer GitHub-maintained actions where available
- Minimize third-party actions
- Do not fabricate SHAs
- Report unresolved SHA lookups as release blockers
