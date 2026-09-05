# Hardening guide (self-hosted)

Operational guidance for deploying the Cited community edition securely.
This is not a compliance checklist.

## TLS and reverse proxy

- Terminate TLS at a reverse proxy (nginx, Caddy, Traefik)
- Set `Strict-Transport-Security` (included in production responses)
- Forward `X-Forwarded-Proto: https` when proxying
- Restrict admin paths to trusted networks where possible

## Trusted hosts

- Set `NEXT_PUBLIC_APP_URL` to the canonical HTTPS URL
- Do not allow arbitrary Host headers to influence generated links
- Block direct access to the database port from the public internet

## Secret generation and rotation

Generate high-entropy values for:

- `AUTH_SECRET` (minimum 32 characters)
- Bootstrap token (single-use setup)
- `MONITORING_CRON_SECRET`
- `SLACK_WEBHOOK_ENCRYPTION_KEY`
- Database passwords

Store secrets in `.cited/secrets/` with mode `600`. Rotate by updating secret
files and restarting services. Password changes invalidate existing sessions.

## Database isolation

- Use the `cited_app` runtime role (not superuser)
- Keep migration credentials separate
- Do not use PostgreSQL `trust` authentication
- Bind database to internal Docker network only

## Backups

```bash
npm run self-host:backup
```

Store backups with restrictive permissions. Test restore on a non-production
instance before relying on backups.

## Provider credentials

- Use DataForSEO official hosts only in production
- Do not enable mock provider in production unless testing
- Provider responses are untrusted; never fetch citation URLs server-side

## SMTP and Slack

- SMTP host comes from server configuration only
- Slack webhooks must use `https://hooks.slack.com/services/...`
- Webhook URLs are encrypted at rest and never returned to clients

## Updates

- Review `npm run security:audit` before upgrading
- Regenerate SBOM after dependency changes: `npm run sbom:generate`
- Run `npm run security:check` after configuration changes

## Logging

- Logs are structured JSON with recursive redaction
- Do not pipe logs to third-party services without reviewing redaction
- Use correlation IDs for incident investigation

## Retention

Configure retention environment variables conservatively. Run dry-run first.
See [privacy and data](./privacy-and-data.md).

## Incident response

1. Contain (disable affected accounts, rotate secrets)
2. Preserve logs without copying sensitive content
3. Report vulnerabilities privately (see [SECURITY.md](../../SECURITY.md))
4. Restore from backup if data integrity is affected

## Multi-user deployment risks

Shared self-hosted instances require clear role boundaries. Viewers can read
workspace evidence. Admins can change notification destinations. Limit admin
accounts and review audit events regularly.

## Vulnerability reporting

Report issues through the process in [SECURITY.md](../../SECURITY.md). Do not
test cited.cc production without written permission.
