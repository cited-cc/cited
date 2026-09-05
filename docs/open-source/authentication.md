# Authentication

Cited uses a provider-neutral authentication layer. Product code resolves a canonical internal user ID and never uses email as an authorization key.

## Providers

| Mode | Provider | Session |
| --- | --- | --- |
| Cloud (`CITED_DEPLOYMENT_MODE=cloud`) | Clerk (`CITED_AUTH_PROVIDER=clerk`) | Clerk session |
| Self-hosted (`CITED_DEPLOYMENT_MODE=self_hosted`) | Local email/password (`CITED_AUTH_PROVIDER=local`) | Auth.js credentials session |

Cloud mode keeps existing Clerk sign-in, middleware, and webhook behavior. Self-hosted mode does not require Clerk keys.

## Canonical identities

Internal tables:

- `users`: immutable Cited user ID, normalized email, display name, status
- `auth_identities`: links a user to a provider subject (`clerk` or `local`)
- `local_credentials`: scrypt password hashes for self-hosted users
- `workspace_invitations`: hashed invitation tokens for team onboarding
- `auth_audit_events`: security-sensitive account events without secret values

Workspace membership keeps legacy `clerk_user_id` during migration and adds nullable `user_id` and `owner_user_id` on workspaces. Application authorization prefers `user_id` with a tested fallback to legacy membership subjects.

## Environment variables

Self-hosted example (see `.env.self-hosted.example`):

```bash
CITED_AUTH_PROVIDER=local
AUTH_SECRET="changeme"
CITED_BOOTSTRAP_TOKEN=replace-with-a-long-random-bootstrap-token
CITED_ALLOW_REGISTRATION=false
# CITED_SESSION_MAX_AGE_SECONDS=604800
```

Cloud example continues to require Clerk keys. `AUTH_SECRET` is required for local authentication and Auth.js session signing.

## First-owner bootstrap

Browser setup:

1. Set `CITED_BOOTSTRAP_TOKEN` on the server.
2. Visit `/setup` when no owner exists.
3. Submit the token, owner email, password, and workspace name.
4. Bootstrap creates the user, credentials, workspace, and owner membership transactionally, then signs the owner in.

CLI setup:

```bash
npm run auth:bootstrap
```

The command refuses to run in cloud mode, refuses to overwrite an existing owner, and never prints passwords or tokens.

## Sign-in and sign-out

- Self-hosted: `/sign-in` renders the Cited email/password form backed by Auth.js credentials.
- Cloud: `/sign-in` keeps the existing Clerk form.
- Sign-out invalidates the active session through the selected provider.

## Password security

- Hashing: Node `crypto.scrypt` with random salts and versioned encodings (`scrypt-v1$...`)
- Minimum length: 12 characters
- Maximum accepted input: 256 characters
- Unicode normalization: NFKC before hashing
- Generic invalid-credentials responses
- Rate limiting on login and bootstrap attempts
- Session invalidation after password change (sign out required)

Administrative password recovery for self-hosted deployments uses the maintainer CLI or direct database operations documented for Phase 7 portability work. Email-based reset is intentionally deferred until a notification provider abstraction exists.

## Invitations

Owners and admins can create workspace invitations. The server stores only a SHA-256 hash of the invitation token and returns a one-time URL to the administrator. Invitations expire, are single-use, and cannot escalate roles beyond the invited role.

## Session security

Local sessions use Auth.js JWT sessions with HTTP-only cookies. Production cookies use the `__Secure-` prefix and `secure: true`. SameSite defaults to `lax`. CSRF protection is provided by Auth.js for credential sign-in.

## Rate limiting

Login and bootstrap attempts use privacy-preserving hashed fingerprints via the existing durable rate limiter (`rate_limit_buckets`).

## Workspace roles

Owner, admin, member, and viewer permissions are unchanged. Final owner removal and disable protections are enforced server-side.

## Current limitations

- Product entitlements are deployment-mode aware (Phase 6). See [entitlements.md](./entitlements.md).
- Self-hosted PostgreSQL database bootstrap is available (Phase 7). See [database.md](./database.md).
- Self-hosted email delivery for invitations is not complete; administrators receive the invitation URL once.
- Public registration remains disabled unless `CITED_ALLOW_REGISTRATION=true`.

## Security recommendations

- Use long random `AUTH_SECRET` and `CITED_BOOTSTRAP_TOKEN` values in production.
- Terminate TLS at your reverse proxy for internet-facing deployments.
- Restrict database access to the service role from application servers only.
- Rotate bootstrap tokens after first-owner setup.
- Run `npm run auth:check` in CI to prevent Clerk imports from returning to neutral auth modules.

## Boundary checks

```bash
npm run auth:check
```

The checker verifies neutral auth modules avoid direct Clerk imports, required auth files exist, and self-hosted env examples document provider configuration.
