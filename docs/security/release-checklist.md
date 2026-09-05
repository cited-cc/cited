# Security release checklist

Use before tagging a stable self-hosted release. Not a guarantee of security.

## Pre-release verification

- [ ] `npm run security:scan` passes (no tracked secrets)
- [ ] `npm run security:check` passes (baseline invariants)
- [ ] `npm run security:audit` reviewed (unresolved advisories documented)
- [ ] `npm run sbom:generate` produces reproducible output
- [ ] `npm run publication:check` reviewed (expected blockers documented)
- [ ] `npm run docker:check` passes
- [ ] `npm run test` passes including Phase 13 adversarial tests
- [ ] Docker Compose smoke test with mock provider passes

## Configuration review

- [ ] `AUTH_SECRET` is unique per installation
- [ ] Bootstrap token rotated or disabled after setup
- [ ] `CITED_ALLOW_MOCK_PROVIDER=false` in production
- [ ] `NOTIFICATIONS_ENABLED` reflects operator intent
- [ ] Database not exposed on public ports
- [ ] TLS configured at reverse proxy
- [ ] Retention settings reviewed

## Documentation

- [ ] [Threat model](./threat-model.md) reflects current architecture
- [ ] [Hardening guide](./hardening.md) reviewed
- [ ] [SECURITY.md](../../SECURITY.md) reporting path confirmed

## Explicit non-claims

Do not state in release notes:

- "Penetration tested"
- "SOC 2 certified"
- "HIPAA compliant"
- "GDPR compliant"
- "Zero vulnerabilities"

Report scanner results honestly and document unresolved findings.

## Post-release

- Monitor dependency advisories
- Publish security fixes for supported versions
- Coordinate disclosure for reported vulnerabilities
