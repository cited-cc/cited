# Onboarding (Phase 4)

## Steps

1. Workspace name
2. Domain + brand
3. DNS TXT verification
4. Prompts + AI surfaces + location/cadence
5. Review and finish

Route: `/onboarding`  
Persistence: `workspace_onboarding` (one row per workspace)

## Completion requirements

- Workspace name present
- At least one **verified** domain
- At least one brand
- At least one active prompt
- At least one enabled monitor configuration (AI surface)
- Workspace status `active` or `trialing`
- Actor is owner/admin

On success: set `completed_at` + `workspaces.onboarding_completed_at`, route to `/app`.

## Data created

| Step | Writes |
| --- | --- |
| 1 | `workspaces.name` / `slug` |
| 2 | `domains`, `brands` |
| 3 | domain verification fields + attempts |
| 4 | `monitored_prompts`, `monitor_configurations` (`activation_status=configured`) |
| 5 | onboarding completion timestamps |

## Resume behavior

`current_step` advances on successful saves. Users can leave and return. UI does not allow skipping ahead of persisted progress. Domain verification is required before finish even if prompts were saved earlier.

## Entitlements

Prompt count, surfaces, cadence, and city-level location follow `PLAN_ENTITLEMENTS`.

## Phase 5 relationship

Onboarding saves configuration only. It does **not** enqueue scans or mark monitors `active`. Signal Desk / Inbox use truthful empty-ready copy until monitoring activates.
