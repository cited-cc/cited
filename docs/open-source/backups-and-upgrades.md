# Backups and upgrades (self-hosted)

## Backups

Create a timestamped compressed logical backup:

```bash
npm run self-host:backup
```

Backups are written to `.cited/backups/cited-backup-<timestamp>.sql.gz` with restrictive permissions. Existing files are never overwritten.

Requirements:

- Stack must be running (`db` service reachable)
- Uses `pg_dump` through the Compose project
- Does not include application secret files automatically
- Does not upload anywhere

Cited does not claim a backup is restorable until you validate it in a non-production target.

## Restore preparation (manual)

1. Stop web and worker: `npm run self-host:down` (database volume remains)
2. Create a **new empty database** or maintenance copy
3. Decompress and review the SQL dump
4. Import with `psql` or `pg_restore` appropriate to your dump format
5. Run `npm run db:status` against the target before switching production URLs
6. Update secrets only if credentials changed

There is no automatic restore-over-existing-data command in Phase 11.

## Upgrades

```bash
npm run self-host:upgrade
```

Upgrade behavior:

1. Prompts for backup acknowledgement when backup cannot be created
2. Builds the local image from current source
3. Runs migrations once through the `migrate` service
4. Restarts web and worker
5. Waits for health

Upgrade does not:

- Delete the database volume
- Replace secret files
- Pull from a private registry
- Downgrade automatically

Use `--skip-backup-check` only in controlled maintenance windows.

## Disk growth

Plan for:

- PostgreSQL volume growth with monitoring history
- Backup retention you manage manually
- Container logs rotated by your Docker logging driver

## Secret rotation

1. Stop the stack: `npm run self-host:down`
2. Replace the relevant file in `.cited/secrets/` with a new random value (`0600`)
3. Update database role passwords if rotating database secrets (manual SQL may be required)
4. Start again: `npm run self-host:up`

Rotate `auth_secret` and `bootstrap_token` independently from database passwords.

## Shutdown

`npm run self-host:down` stops containers without `--volumes`. Data and secrets remain on the host.

There is no destructive "destroy everything" command in this phase.
