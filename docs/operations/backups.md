# Backups

Back up PostgreSQL before upgrades or configuration experiments.

## Command

```bash
npm run self-host:backup
```

Writes timestamped SQL dumps under `.cited/backups/`. Backup files are gitignored.

## Restore

1. Stop the stack: `npm run self-host:down`
2. Restore SQL into the PostgreSQL volume with your preferred tooling
3. Restart: `npm run self-host:up`

## Related

- [Backups and upgrades](../open-source/backups-and-upgrades.md)
- [Database](../open-source/database.md)
