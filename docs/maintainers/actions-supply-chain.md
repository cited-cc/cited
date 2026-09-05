# GitHub Actions Supply Chain

Every external action in community workflows is pinned to a verified full commit SHA. Floating tags, `main`, and `master` references are forbidden.

## Inventory

| Action | Repository | Version | SHA | Purpose | Permissions |
|--------|------------|---------|-----|---------|-------------|
| checkout | actions/checkout | v4.2.2 | `11bd71901bbe5b1630ceea73d27597364c9af683` | Clone repository | contents: read |
| setup-node | actions/setup-node | v4.4.0 | `49933ea5288caeca8642d1e84afbd3f7d6820020` | Install Node.js 22 | contents: read |
| cache | actions/cache | v4.2.0 | `1bd1e32a3bdc45362d1e726936510720a7c30a57` | npm cache | contents: read |
| upload-artifact | actions/upload-artifact | v4.6.0 | `65c4c4a1ddee5b72f698fdd19549f0f0fb45cf08` | Failure artifacts and SBOM | contents: read |
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
