# Unsubscribe

## Tokens

Created just-in-time when sending email.

- Cryptographically random raw token (base64url)
- Only SHA-256 `token_hash` stored in `notification_unsubscribe_tokens`
- Email stored as `email_hash` only
- TTL: `NOTIFICATION_UNSUBSCRIBE_TOKEN_TTL_DAYS` (default 90)
- Single-use (`used_at`)

## Scopes

- `all_email`
- `instant_alerts`
- `weekly_digest`
- `monitor_issues`
- `free_scan_followup`

## Flow

1. Recipient opens `/unsubscribe/[token]`
2. Invalid/expired tokens show a generic message (no email/workspace leak)
3. Confirm submits `POST /api/unsubscribe` with the token
4. Preference updates apply to the scoped user prefs only
5. Slack settings are never changed

## Effects

- Does not delete evidence, outbox, or delivery logs
- Does not disable workspace monitoring
- Does not resubscribe users from email links

Authenticated manage link: `/preferences/notifications` → `/app/settings/notifications`.
