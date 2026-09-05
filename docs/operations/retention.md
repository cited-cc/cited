# Retention

Self-hosted operators control how long selected operational data is kept.

## Settings

| Variable | Default | Purpose |
| --- | --- | --- |
| `CITED_RETENTION_DRY_RUN` | unset | Log retention actions without deleting |
| `CITED_RETENTION_EXPIRED_INVITATIONS_DAYS` | 0 | Expired invitation cleanup |
| `CITED_RETENTION_RATE_LIMIT_BUCKETS_DAYS` | 7 | Rate limit bucket cleanup |
| `CITED_RETENTION_FAILED_NOTIFICATIONS_DAYS` | 0 | Failed notification cleanup |

## History limits

Optional workspace history caps:

```bash
CITED_SELF_HOSTED_HISTORY_DAYS=unlimited
```

## Related

- [Environment variables](../reference/environment-variables.md)
- [Privacy and data](../security/privacy-and-data.md)
