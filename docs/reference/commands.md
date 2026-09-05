# Commands

All supported `npm run` scripts in the community edition repository.

## Development

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js development server |
| `npm run prebuild` | Generate sitemap before production build |
| `npm run build` | Production build (self-hosted mode) |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

## Testing

| Command | Description |
| --- | --- |
| `npm run test` | Run all Vitest projects |
| `npm run test:unit` | Unit tests |
| `npm run test:integration` | PostgreSQL integration tests |
| `npm run test:security` | Security tests |
| `npm run test:boundary` | Boundary and policy tests |
| `npm run test:coverage` | Coverage report |
| `npm run test:all` | Alias for full Vitest run |
| `npm run test:e2e` | Playwright browser tests |
| `npm run e2e:server` | Prepare database and start server for Playwright |
| `npm run test:watch` | Vitest watch mode |

## Security

| Command | Description |
| --- | --- |
| `npm run security:scan` | Secret pattern scan |
| `npm run security:check` | Security baseline verification |
| `npm run security:audit` | Dependency audit |
| `npm run sbom:generate` | Generate SBOM |

## Database

| Command | Description |
| --- | --- |
| `npm run db:migrate` | Apply migrations |
| `npm run db:status` | Migration status |
| `npm run db:validate` | Validate schema expectations |
| `npm run db:seed` | Load fictional demo fixtures |
| `npm run db:reset:local` | Reset local database (destructive) |
| `npm run db:types` | Generate TypeScript DB types |
| `npm run db:types:check` | Verify generated types |
| `npm run db:migration-ci` | CI migration verification |
| `npm run seed` | Alias for `db:seed` |

## Providers

| Command | Description |
| --- | --- |
| `npm run provider:list` | List registered providers |
| `npm run provider:check` | Provider boundary checks |
| `npm run provider:doctor` | Provider diagnostics |

## Monitoring

| Command | Description |
| --- | --- |
| `npm run monitoring:check` | Monitoring boundary checks |
| `npm run monitoring:doctor` | Monitoring diagnostics |

## Worker

| Command | Description |
| --- | --- |
| `npm run jobs:run` | Run a single job (scripted) |
| `npm run jobs:worker` | Start background worker loop |
| `npm run scheduler:check` | Scheduler configuration check |

## Notifications

| Command | Description |
| --- | --- |
| `npm run notifications:check` | Notification adapter checks |

## Docker and self-hosting

| Command | Description |
| --- | --- |
| `npm run docker:check` | Docker boundary checks |
| `npm run self-host:init` | Generate local secrets |
| `npm run self-host:up` | Start Docker Compose stack |
| `npm run self-host:down` | Stop stack (preserve data) |
| `npm run self-host:status` | Service status |
| `npm run self-host:logs` | Tail service logs |
| `npm run self-host:token` | Print bootstrap token |
| `npm run self-host:doctor` | Self-host diagnostics |
| `npm run self-host:backup` | Database backup |
| `npm run self-host:upgrade` | Rebuild and restart |
| `npm run self-host:smoke` | Compose smoke test |

## Backups and upgrades

See `self-host:backup` and `self-host:upgrade` above.

## Documentation

| Command | Description |
| --- | --- |
| `npm run docs:check` | Documentation structure and hygiene |
| `npm run readme:check` | README requirements |
| `npm run assets:check` | Image and brand asset validation |
| `npm run docs:links` | Internal link verification |
| `npm run docs:screenshots` | Generate documentation screenshots |
| `npm run docs:integrity` | Legacy integrity scaffold (Phase 14) |
| `npm run env:drift` | Environment doc drift check |
| `npm run commands:drift` | Command doc drift check |
| `npm run screenshot:freshness` | Screenshot manifest freshness |
| `npm run brand:render` | Render brand PNG assets from templates |

## CI and publication

| Command | Description |
| --- | --- |
| `npm run ci:check` | Local CI parity runner |
| `npm run release:check` | Release gate validation |
| `npm run release:prepare` | Prepare local release metadata files |
| `npm run release:artifacts` | Generate release artifact bundle |
| `npm run workflow:check` | GitHub Actions security review |
| `npm run test-fixtures:check` | Test fixture policy |
| `npm run publication:check` | Publication readiness |
| `npm run public-surface:check` | Public surface boundary |
| `npm run deployment:check` | Deployment mode boundaries |
| `npm run auth:check` | Auth boundary checks |
| `npm run database:check` | Database boundary checks |
| `npm run billing:check` | Billing boundary checks |
| `npm run license:check` | Dependency license inventory |
| `npm run content:check` | Content guard |
| `npm run seo:check` | SEO guard (self-hosted) |
| `npm run auth:bootstrap` | Auth bootstrap utility |

## SEO utilities

| Command | Description |
| --- | --- |
| `npm run seo:generate-sitemap` | Generate sitemap |
| `npm run seo:submit` | Submit indexing (not used in community CI) |
