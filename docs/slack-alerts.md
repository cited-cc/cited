# Slack alerts

## Connection

Owners/admins paste an incoming Slack webhook URL in `/app/settings/notifications`.

- Validated as `https://hooks.slack.com/services/...`
- Encrypted with AES-256-GCM using `SLACK_WEBHOOK_ENCRYPTION_KEY`
- Stored in `notification_preferences.slack_webhook_url_encrypted`
- Never returned to the browser after save
- UI shows only: Connected / Not connected / Needs attention

## Messages

Block Kit JSON without a Slack SDK.

Instant alerts: short header, surface/type context, truncated prompt, bounded evidence, CTA to `/app/inbox/[eventId]`.

Digest: counts + up to 3 highlights + Inbox CTA.

No full AI responses, private notes/annotations, or raw provider payloads.

External source URLs are not used as primary CTAs.

## Test message

Explicit owner/admin action, rate-limited:

> Cited test message. Slack alerts are connected for this workspace.

No real event data.

## Failure handling

- 2xx: success; update `slack_last_success_at`
- 429: retryable with Retry-After
- 5xx / network / timeout: retryable
- 404/410: permanent; mark `needs_attention`
- Slack failure never blocks email delivery success on the same outbox row

## Encryption key

`SLACK_WEBHOOK_ENCRYPTION_KEY`: 64-char hex preferred, or any passphrase (SHA-256 derived).

If missing in an environment, Slack setup is disabled with a safe settings error.

Rotation requires re-connecting webhooks (ciphertext is not re-encrypted automatically).
