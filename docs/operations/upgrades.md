# Upgrades

Upgrade a self-hosted installation by rebuilding the local image and running migrations.

## Workflow

```bash
npm run self-host:upgrade
```

Or manually:

```bash
git pull
npm ci
npm run self-host:down
npm run self-host:up
```

Migrations run automatically on startup.

## Before upgrading

1. Run `npm run self-host:backup`
2. Read [CHANGELOG](../../CHANGELOG.md) for breaking changes
3. Review [environment variables](../reference/environment-variables.md) for new settings

## Related

- [Backups](backups.md)
- [Troubleshooting](troubleshooting.md)
