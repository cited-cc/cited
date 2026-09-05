# First run setup

After `npm run self-host:up`, complete one-time owner bootstrap before using the product.

## Bootstrap flow

1. **Retrieve token** (one time):

   ```bash
   npm run self-host:token
   ```

2. **Open setup**: visit `/setup` on your local URL (default `http://localhost:3000/setup`).

3. **Create owner**: provide the setup token, owner email, password, and workspace name.

4. **Sign in**: use `/sign-in` for subsequent sessions.

Setup closes automatically after the first owner is created. `/setup` returns a not-available response afterward.

## Secret generation

`npm run self-host:init` creates secret files with `0600` permissions:

| Secret file | Purpose |
| --- | --- |
| `postgres_owner_password` | Migration and admin database role |
| `postgres_runtime_password` | Application runtime database role |
| `auth_secret` | Session signing |
| `bootstrap_token` | First-owner setup gate |
| `monitoring_cron_secret` | Internal scheduler authentication |
| `slack_webhook_encryption_key` | Slack webhook encryption at rest |

Existing secrets are never overwritten. Rotate manually while the stack is stopped, then restart.

## Defaults

| Setting | Default |
| --- | --- |
| Monitoring provider | `mock` (fictional data) |
| Notifications | disabled |
| Email provider | disabled |
| Auth | local email and password |
| Database | PostgreSQL 17 |

## Optional demo seed

After migrations, load fictional fixtures:

```bash
npm run db:seed
```

Requires `DATABASE_URL` pointing at the running PostgreSQL instance. Demo data uses reserved example domains only.

## Related

- [Quickstart](quickstart.md)
- [First monitor tutorial](first-monitor.md)
- [Authentication](../open-source/authentication.md)
