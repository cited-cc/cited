# Notifications

Self-hosted Cited supports SMTP and Slack notifications. Email delivery is **disabled by default**.

## SMTP

```bash
NOTIFICATIONS_ENABLED=true
CITED_EMAIL_PROVIDER=smtp
SMTP_HOST=mail.example.com
SMTP_PORT=587
SMTP_FROM_EMAIL=cited@example.com
SMTP_USER=
SMTP_PASSWORD=
```

Use Mailpit locally (see [Docker operations](docker.md)).

## Slack

Configure workspace Slack webhooks in the application UI. Webhook URLs are encrypted at rest using `SLACK_WEBHOOK_ENCRYPTION_KEY`.

## Safe testing

- Keep `NOTIFICATIONS_ENABLED=false` during mock tutorials
- Use Mailpit for local SMTP capture
- Do not point test installations at production webhook URLs

## Cron dispatch

Notification dispatch uses `NOTIFICATIONS_CRON_SECRET` or falls back to `MONITORING_CRON_SECRET`.

## Related

- [Notifications architecture](../notifications.md)
- [Slack alerts](../slack-alerts.md)
