# Domain verification (Phase 4)

## Method

Production method: **DNS TXT** only.

Record format:

```text
Type: TXT
Host: @          # or subdomain label, e.g. blog
Value: cited-verification=<token>
```

Token generation: cryptographically random (`lib/domains/verify-dns-txt.ts`).

## Flow

1. Onboarding domain step creates/updates `domains` with `verification_status=pending`.
2. UI shows host + value with copy controls.
3. `Verify domain` runs server-side DNS TXT lookup (Node `dns` module).
4. Match updates `verified_at`, `verification_method=dns_txt`.
5. Attempts recorded in `domain_verification_attempts` (rate-limited).

## Token rotation

`Regenerate record` invalidates the previous token immediately. Never log raw tokens. Never expose tokens outside owner/admin setup.

## Rate limits

Max 10 verification attempts per domain per workspace per hour.

## Security boundaries

- DNS lookup is server-side only.
- No browser DNS checks.
- No HTTP/meta/file fetch verification in this phase (avoids SSRF).
- Cross-workspace domain conflicts return a generic message: “This domain cannot be added to this workspace.”
- Do not reveal whether another customer owns a domain.

## Troubleshooting (user-facing)

- DNS can take time to propagate.
- Confirm host label (`@` vs subdomain).
- Confirm exact value including `cited-verification=` prefix.
- After regenerate, remove the old TXT value.
