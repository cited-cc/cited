# Threat model (community edition)

This document describes the security architecture for the self-hosted Cited
community edition. It is architectural guidance, not a certification or audit
report. Cited is not claimed to be penetration-tested, SOC 2 certified, HIPAA
compliant, or GDPR compliant.

## Protected assets

- Workspace membership and role assignments
- User credentials (password hashes, session tokens)
- Bootstrap and invitation tokens
- Monitored prompts and domain configuration
- Provider responses, citations, and evidence records
- Notebook entries and annotations
- Notification preferences and encrypted Slack webhook URLs
- SMTP and provider API credentials
- Database contents and backups
- Operator secrets (`.cited/secrets/`, environment files)

## Trust boundaries

| Boundary | Description |
| --- | --- |
| Browser / server | Untrusted HTML, cookies, and form input enter the server |
| Web / worker | Background worker shares database access but not browser sessions |
| Application / database | Application enforces workspace scope; RLS is deny-by-default |
| Monitoring provider | DataForSEO responses are untrusted content |
| Notification boundary | Slack and SMTP destinations are operator-configured egress |
| Container / host | Docker Compose isolates database on internal network |

## User roles

| Role | Trust level |
| --- | --- |
| Owner | Full workspace control; final owner cannot be removed accidentally |
| Admin | Settings, notifications, user management (below owner) |
| Member | Create monitors, triage inbox, export evidence |
| Viewer | Read-only inbox and notebook access |
| Unauthenticated | Marketing pages, sign-in, bootstrap (when eligible) |
| Disabled | No access; existing sessions invalidated |

## Attacker capabilities

We assume attackers can:

- Submit arbitrary HTTP requests to exposed routes
- Brute-force or replay authentication and invitation tokens
- Supply malicious provider JSON, citation URLs, and CSV export targets
- Attempt cross-workspace IDOR using guessed UUIDs
- Probe for SSRF via notification or provider configuration
- Exhaust resources via oversized payloads or expensive operations
- Read public source code and dependency advisories

We do not assume attackers can:

- Read operator secret files or database backups without host compromise
- Modify container images without supply-chain compromise
- Break modern password hashing or AES-256-GCM without key material

## Security assumptions

- Operators deploy behind TLS with a trusted reverse proxy
- `AUTH_SECRET`, bootstrap token, and database passwords are high-entropy
- PostgreSQL runtime role is not a superuser
- Host filesystem permissions protect `.cited/secrets/` and backups
- Operators review dependency advisories before upgrading

## Administrator responsibilities

- Generate and rotate secrets
- Configure TLS, trusted hosts, and firewall rules
- Restrict database port exposure
- Configure retention according to policy
- Monitor logs without storing sensitive content
- Apply security updates promptly
- Maintain offline backups with restrictive permissions

## Explicit non-goals

- Hosted Cited Cloud (`cited.cc`) operations
- Compliance certification or legal advice
- Protection against fully compromised host or database superuser
- Prevention of all denial-of-service at network edge (use reverse proxy WAF)
- Automatic workspace deletion without explicit administrator action

## Residual risks

- Application-layer authorization relies on service-layer workspace scoping;
  RLS is deny-by-default but not a substitute for repository scoping
- JWT sessions require periodic validation against credential changes
- Memory-only rate limits degrade under multi-process load until durable
  buckets apply
- Provider content may contain social-engineering text; rendering is escaped
  but operators must not treat AI output as instructions
- Self-hosted operators bear responsibility for TLS, backups, and patching

## Threat coverage (summary)

| Threat | Mitigation |
| --- | --- |
| Account takeover | scrypt passwords, lockout, durable login rate limits |
| Session theft / fixation | HttpOnly cookies, rotation on login, bounded expiry |
| Brute-force login | Durable rate limits, account lockout |
| Bootstrap takeover | Single-use bootstrap, timing-safe token compare |
| Invitation token theft | Hashed tokens, TTL, email match on accept |
| Cross-workspace access | Workspace-scoped queries, role guards |
| IDOR | IDs alone never grant access |
| SQL injection | Parameterized queries, identifier allowlists |
| XSS | Plain-text rendering, CSP, no dangerouslySetInnerHTML in evidence |
| CSRF | Framework protections, POST for mutations |
| SSRF | No citation URL fetch; egress allowlist |
| Open redirects | Allowlisted relative paths |
| Host-header poisoning | Server-controlled canonical URL |
| Malicious provider content | Schema validation, size bounds, escaping |
| CSV formula injection | Cell prefix neutralization |
| Secrets in logs | Recursive redaction |
| Queue poisoning | Cron bearer secrets, outbox dedupe |
| Resource exhaustion | Rate limits, pagination bounds |
| Notification abuse | Role gates, test-send limits |
| Dependency compromise | Lockfile, audit, SBOM |
| Container exposure | Non-root, cap_drop, internal DB network |
| Backup disclosure | Restrictive file permissions (operator) |
