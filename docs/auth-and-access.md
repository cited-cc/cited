# Auth and access (Phase 4)

## Clerk model

- `@clerk/nextjs` App Router integration with `ClerkProvider` in the root layout.
- Public auth routes: `/sign-in`, `/sign-up`, `/forgot-password` (custom Clerk email/password UI, plan intent preserved).
- Server helpers: `requireAuthenticatedUser`, `requireWorkspaceMembership`, `requireWorkspaceRole`.
- Safe redirects: `lib/auth/redirects.ts` (same-origin relative paths only).

## Public vs protected routes

Public (examples):

- `/`, `/pricing`, `/scan`, `/how-it-works`, `/docs`, `/security`, `/privacy`, `/terms`
- `/sign-in`, `/sign-up`, `/forgot-password`
- `/api/health`, `/api/webhooks/*`, `/api/scan`
- `robots.txt`, `sitemap.xml`, `manifest.webmanifest`

Protected via `proxy.ts` + layout access resolution:

- `/app/*`
- `/onboarding/*`
- `/checkout/*`
- `/api/billing/*`
- `/api/internal/*`

## Access-state resolution

`resolveCurrentAccessState()` in `lib/auth/access-state.ts` returns a typed state:

| Kind | Typical destination |
| --- | --- |
| `unauthenticated` | `/sign-in` |
| `authenticated_no_workspace` | `/pricing` |
| `checkout_pending` | `/checkout?plan=…` |
| `workspace_onboarding` | `/onboarding` |
| `workspace_active` | `/app` |
| `workspace_past_due` | `/app/billing?notice=past_due` |
| `workspace_canceled` / `workspace_suspended` | `/app/billing` with notice |

Rules:

1. Authenticated alone is not enough for `/app`.
2. Paid workspace + incomplete onboarding goes to `/onboarding`.
3. Never trust client-supplied plan, workspace id, or subscription status for authorization.

## Workspace roles

`owner` > `admin` > `member` > `viewer`

Onboarding mutations require `owner` or `admin`. Billing management (portal, plan changes, cancel) requires `owner` or `admin` via `canManageBilling()`.
