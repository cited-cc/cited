-- Cited Phase 9: billing lifecycle, plan changes, usage snapshots, Founder release.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.billing_status as enum (
  'active',
  'trialing',
  'past_due',
  'unpaid',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'paused',
  'suspended',
  'unknown'
);

create type public.billing_event_source as enum (
  'stripe_webhook',
  'manual_reconciliation',
  'customer_portal',
  'checkout',
  'system'
);

create type public.billing_event_status as enum (
  'received',
  'processed',
  'ignored',
  'failed',
  'reconciled'
);

create type public.plan_change_type as enum (
  'upgrade',
  'downgrade',
  'reactivation',
  'cancelation',
  'portal'
);

create type public.plan_change_status as enum (
  'requested',
  'pending_stripe',
  'completed',
  'failed',
  'canceled',
  'expired'
);

-- ---------------------------------------------------------------------------
-- workspaces: billing projection fields
-- ---------------------------------------------------------------------------

alter table public.workspaces
  add column if not exists stripe_subscription_item_id text,
  add column if not exists stripe_price_id_snapshot text,
  add column if not exists billing_status public.billing_status,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists canceled_at timestamptz,
  add column if not exists trial_start timestamptz,
  add column if not exists trial_end timestamptz,
  add column if not exists billing_grace_until timestamptz,
  add column if not exists billing_last_synced_at timestamptz,
  add column if not exists billing_sync_error_code text,
  add column if not exists billing_sync_error_at timestamptz;

-- Backfill billing_status from operational status where missing.
update public.workspaces
set billing_status = case status
  when 'active' then 'active'::public.billing_status
  when 'trialing' then 'trialing'::public.billing_status
  when 'past_due' then 'past_due'::public.billing_status
  when 'canceled' then 'canceled'::public.billing_status
  when 'suspended' then 'suspended'::public.billing_status
  else 'unknown'::public.billing_status
end
where billing_status is null;

alter table public.workspaces
  alter column billing_status set default 'unknown'::public.billing_status;

alter table public.workspaces
  alter column billing_status set not null;

create index if not exists workspaces_billing_status_idx
  on public.workspaces (billing_status);

create index if not exists workspaces_current_period_end_idx
  on public.workspaces (current_period_end)
  where current_period_end is not null;

create index if not exists workspaces_billing_last_synced_at_idx
  on public.workspaces (billing_last_synced_at)
  where billing_last_synced_at is not null;

create index if not exists workspaces_cancel_at_period_end_idx
  on public.workspaces (cancel_at_period_end)
  where cancel_at_period_end = true;

-- ---------------------------------------------------------------------------
-- billing_events (safe summaries only; no raw Stripe payloads)
-- ---------------------------------------------------------------------------

create table public.billing_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete set null,
  stripe_event_id text,
  event_type text not null,
  source public.billing_event_source not null,
  status public.billing_event_status not null default 'received',
  safe_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index billing_events_workspace_id_idx
  on public.billing_events (workspace_id);

create index billing_events_event_type_idx
  on public.billing_events (event_type);

create index billing_events_created_at_idx
  on public.billing_events (created_at desc);

create unique index billing_events_stripe_event_id_uidx
  on public.billing_events (stripe_event_id)
  where stripe_event_id is not null;

alter table public.billing_events enable row level security;

-- ---------------------------------------------------------------------------
-- plan_change_requests (audit / UX support; Stripe remains source of truth)
-- ---------------------------------------------------------------------------

create table public.plan_change_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  requested_by_clerk_user_id text not null,
  from_plan_key public.plan_key not null,
  to_plan_key public.plan_key,
  change_type public.plan_change_type not null,
  status public.plan_change_status not null default 'requested',
  stripe_subscription_id text,
  stripe_checkout_session_id text,
  stripe_portal_session_id text,
  effective_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index plan_change_requests_workspace_id_idx
  on public.plan_change_requests (workspace_id);

create index plan_change_requests_requester_idx
  on public.plan_change_requests (requested_by_clerk_user_id);

create index plan_change_requests_status_idx
  on public.plan_change_requests (status);

create unique index plan_change_requests_active_target_uidx
  on public.plan_change_requests (workspace_id, to_plan_key)
  where status in ('requested', 'pending_stripe')
    and to_plan_key is not null;

create trigger plan_change_requests_set_updated_at
  before update on public.plan_change_requests
  for each row execute function public.set_updated_at();

alter table public.plan_change_requests enable row level security;

-- ---------------------------------------------------------------------------
-- billing_usage_snapshots (customer-facing meters; not billing source of truth)
-- ---------------------------------------------------------------------------

create table public.billing_usage_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  billing_period_start timestamptz not null,
  billing_period_end timestamptz not null,
  plan_key_snapshot public.plan_key not null,
  domains_used integer not null default 0 check (domains_used >= 0),
  domains_limit integer not null check (domains_limit >= 0),
  prompts_used integer not null default 0 check (prompts_used >= 0),
  prompts_limit integer not null check (prompts_limit >= 0),
  active_monitor_configurations_used integer not null default 0
    check (active_monitor_configurations_used >= 0),
  active_monitor_configurations_limit integer not null
    check (active_monitor_configurations_limit >= 0),
  monitor_checks_used integer not null default 0 check (monitor_checks_used >= 0),
  monitor_checks_limit integer not null check (monitor_checks_limit >= 0),
  members_used integer not null default 0 check (members_used >= 0),
  members_limit integer not null check (members_limit >= 0),
  provider_cost_usd_estimate numeric(12, 6),
  provider_cost_usd_actual numeric(12, 6),
  generated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint billing_usage_snapshots_period_check
    check (billing_period_end > billing_period_start)
);

create unique index billing_usage_snapshots_workspace_period_uidx
  on public.billing_usage_snapshots (
    workspace_id,
    billing_period_start,
    billing_period_end
  );

create index billing_usage_snapshots_workspace_generated_idx
  on public.billing_usage_snapshots (workspace_id, generated_at desc);

alter table public.billing_usage_snapshots enable row level security;

-- ---------------------------------------------------------------------------
-- Founder: release active slot when a Founder subscription fully ends
-- ---------------------------------------------------------------------------

create or replace function public.release_founder_active_slot()
returns boolean
language plpgsql
as $$
begin
  update public.plan_inventory
  set
    active_count = greatest(0, active_count - 1),
    updated_at = timezone('utc', now())
  where plan_key = 'founder'
    and active_count > 0;

  return found;
end;
$$;
