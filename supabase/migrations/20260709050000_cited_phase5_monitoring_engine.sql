-- Cited Phase 5: durable monitoring engine, usage ledger, occurrences, provider tasks.

-- ---------------------------------------------------------------------------
-- Enum extensions
-- ---------------------------------------------------------------------------

alter type public.monitor_activation_status add value if not exists 'blocked';
alter type public.monitor_activation_status add value if not exists 'disabled';

create type public.scan_run_type as enum (
  'baseline',
  'recurring',
  'manual'
);

create type public.provider_cost_type as enum (
  'actual',
  'estimated',
  'unknown'
);

create type public.provider_task_status as enum (
  'submitted',
  'pending',
  'completed',
  'failed',
  'abandoned'
);

create type public.monitoring_usage_metric_key as enum (
  'provider_task_submitted',
  'monitor_check_completed',
  'provider_cost_usd',
  'baseline_scan_completed',
  'recurring_scan_completed'
);

create type public.notification_outbox_status as enum (
  'pending',
  'processing',
  'delivered',
  'canceled',
  'failed'
);

-- ---------------------------------------------------------------------------
-- monitor_configurations: scheduling + activation metadata
-- ---------------------------------------------------------------------------

alter table public.monitor_configurations
  add column if not exists next_run_at timestamptz,
  add column if not exists last_run_at timestamptz,
  add column if not exists last_successful_run_at timestamptz,
  add column if not exists last_failure_at timestamptz,
  add column if not exists failure_streak integer not null default 0
    check (failure_streak >= 0),
  add column if not exists paused_at timestamptz,
  add column if not exists pause_reason text,
  add column if not exists activated_at timestamptz,
  add column if not exists schedule_version integer not null default 1
    check (schedule_version >= 1);

create index if not exists monitor_configurations_due_idx
  on public.monitor_configurations (activation_status, next_run_at)
  where activation_status = 'active' and enabled = true;

create index if not exists monitor_configurations_workspace_activation_idx
  on public.monitor_configurations (workspace_id, activation_status);

-- ---------------------------------------------------------------------------
-- scan_runs: durable job fields
-- ---------------------------------------------------------------------------

alter table public.scan_runs
  add column if not exists scheduled_for timestamptz,
  add column if not exists run_type public.scan_run_type not null default 'recurring',
  add column if not exists attempt_count integer not null default 0
    check (attempt_count >= 0),
  add column if not exists poll_attempt_count integer not null default 0
    check (poll_attempt_count >= 0),
  add column if not exists next_attempt_at timestamptz,
  add column if not exists next_poll_at timestamptz,
  add column if not exists claimed_at timestamptz,
  add column if not exists claimed_by text,
  add column if not exists lease_expires_at timestamptz,
  add column if not exists completed_with_warnings boolean not null default false,
  add column if not exists provider_cost_type public.provider_cost_type,
  add column if not exists provider_error_category text,
  add column if not exists provider_status_code integer,
  add column if not exists result_summary jsonb not null default '{}'::jsonb,
  add column if not exists correlation_id text,
  add column if not exists idempotency_key text;

-- Backfill scheduled_for for any existing rows.
update public.scan_runs
set scheduled_for = coalesce(scheduled_for, requested_at, created_at)
where scheduled_for is null;

alter table public.scan_runs
  alter column scheduled_for set not null;

create unique index if not exists scan_runs_slot_unique_idx
  on public.scan_runs (monitor_configuration_id, scheduled_for, run_type);

create unique index if not exists scan_runs_idempotency_key_uidx
  on public.scan_runs (idempotency_key)
  where idempotency_key is not null;

create index if not exists scan_runs_claim_queue_idx
  on public.scan_runs (status, next_attempt_at, lease_expires_at)
  where status in ('queued', 'running');

create index if not exists scan_runs_poll_queue_idx
  on public.scan_runs (status, next_poll_at)
  where status = 'running' and next_poll_at is not null;

create index if not exists scan_runs_workspace_status_idx
  on public.scan_runs (workspace_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- citation_events: fingerprint + monitor linkage for dedupe
-- ---------------------------------------------------------------------------

alter table public.citation_events
  add column if not exists monitor_configuration_id uuid
    references public.monitor_configurations (id) on delete set null,
  add column if not exists event_fingerprint text,
  add column if not exists ai_surface public.ai_surface_key,
  add column if not exists occurrence_count integer not null default 1
    check (occurrence_count >= 1),
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists citation_events_fingerprint_uidx
  on public.citation_events (workspace_id, event_fingerprint)
  where event_fingerprint is not null;

create index if not exists citation_events_monitor_configuration_id_idx
  on public.citation_events (monitor_configuration_id);

create index if not exists citation_events_last_seen_at_idx
  on public.citation_events (workspace_id, last_seen_at desc);

-- ---------------------------------------------------------------------------
-- citation_event_occurrences
-- ---------------------------------------------------------------------------

create table public.citation_event_occurrences (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  citation_event_id uuid not null references public.citation_events (id) on delete cascade,
  scan_run_id uuid not null references public.scan_runs (id) on delete cascade,
  ai_response_id uuid not null references public.ai_responses (id) on delete cascade,
  observed_at timestamptz not null default timezone('utc', now()),
  event_type public.citation_event_type not null,
  source_url_normalized text,
  source_hostname text,
  source_title text,
  source_snippet text,
  citation_position integer,
  confidence_score numeric(5, 4) not null default 0
    check (confidence_score >= 0 and confidence_score <= 1),
  evidence_hash text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint citation_event_occurrences_unique_per_run
    unique (citation_event_id, scan_run_id),
  constraint citation_event_occurrences_evidence_hash_unique
    unique (scan_run_id, evidence_hash)
);

create index citation_event_occurrences_workspace_id_idx
  on public.citation_event_occurrences (workspace_id);

create index citation_event_occurrences_citation_event_id_idx
  on public.citation_event_occurrences (citation_event_id);

create index citation_event_occurrences_scan_run_id_idx
  on public.citation_event_occurrences (scan_run_id);

alter table public.citation_event_occurrences enable row level security;

-- ---------------------------------------------------------------------------
-- monitoring_usage_events
-- ---------------------------------------------------------------------------

create table public.monitoring_usage_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  scan_run_id uuid references public.scan_runs (id) on delete set null,
  metric_key public.monitoring_usage_metric_key not null,
  quantity numeric(14, 6) not null default 1 check (quantity >= 0),
  billing_period_start timestamptz not null,
  billing_period_end timestamptz not null,
  source text not null default 'monitoring_engine',
  created_at timestamptz not null default timezone('utc', now()),
  constraint monitoring_usage_events_period_check
    check (billing_period_end > billing_period_start),
  constraint monitoring_usage_events_scan_metric_unique
    unique (scan_run_id, metric_key)
);

create index monitoring_usage_events_workspace_period_idx
  on public.monitoring_usage_events (
    workspace_id,
    metric_key,
    billing_period_start,
    billing_period_end
  );

alter table public.monitoring_usage_events enable row level security;

-- ---------------------------------------------------------------------------
-- provider_tasks
-- ---------------------------------------------------------------------------

create table public.provider_tasks (
  id uuid primary key default gen_random_uuid(),
  scan_run_id uuid not null references public.scan_runs (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  provider text not null default 'dataforseo',
  provider_task_id text,
  provider_request_id text,
  status public.provider_task_status not null default 'submitted',
  submitted_at timestamptz not null default timezone('utc', now()),
  last_polled_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint provider_tasks_scan_run_unique unique (scan_run_id)
);

create index provider_tasks_pending_idx
  on public.provider_tasks (status, last_polled_at)
  where status in ('submitted', 'pending');

create index provider_tasks_provider_task_id_idx
  on public.provider_tasks (provider, provider_task_id)
  where provider_task_id is not null;

create trigger provider_tasks_set_updated_at
  before update on public.provider_tasks
  for each row execute function public.set_updated_at();

alter table public.provider_tasks enable row level security;

-- ---------------------------------------------------------------------------
-- monitoring_audit_events
-- ---------------------------------------------------------------------------

create table public.monitoring_audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  monitor_configuration_id uuid references public.monitor_configurations (id) on delete set null,
  scan_run_id uuid references public.scan_runs (id) on delete set null,
  event_name text not null,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index monitoring_audit_events_workspace_id_idx
  on public.monitoring_audit_events (workspace_id, created_at desc);

create index monitoring_audit_events_event_name_idx
  on public.monitoring_audit_events (event_name, created_at desc);

alter table public.monitoring_audit_events enable row level security;

-- ---------------------------------------------------------------------------
-- notification_outbox (alert-ready only; Phase 8 delivers)
-- ---------------------------------------------------------------------------

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  event_type text not null,
  source_entity_type text not null,
  source_entity_id text not null,
  status public.notification_outbox_status not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  available_at timestamptz not null default timezone('utc', now()),
  delivered_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint notification_outbox_dedupe_unique
    unique (workspace_id, event_type, source_entity_type, source_entity_id)
);

create index notification_outbox_pending_idx
  on public.notification_outbox (status, available_at)
  where status = 'pending';

alter table public.notification_outbox enable row level security;

-- ---------------------------------------------------------------------------
-- workspaces: billing period start for usage windows
-- ---------------------------------------------------------------------------

alter table public.workspaces
  add column if not exists current_period_start timestamptz;

-- ---------------------------------------------------------------------------
-- ai_surfaces: mark ChatGPT/Gemini as beta (enabled via app config)
-- ---------------------------------------------------------------------------

update public.ai_surfaces
set status = 'beta',
    supports_location = true,
    supports_scheduled_monitoring = true,
    updated_at = timezone('utc', now())
where key = 'chatgpt';

update public.ai_surfaces
set status = 'beta',
    supports_location = false,
    supports_scheduled_monitoring = true,
    updated_at = timezone('utc', now())
where key = 'gemini';

update public.ai_surfaces
set status = 'planned',
    supports_scheduled_monitoring = false,
    updated_at = timezone('utc', now())
where key in ('google_ai_overviews', 'perplexity', 'claude');

-- ---------------------------------------------------------------------------
-- Atomic claim helper (FOR UPDATE SKIP LOCKED)
-- ---------------------------------------------------------------------------

create or replace function public.claim_due_scan_runs(
  p_limit integer,
  p_worker_id text,
  p_lease_seconds integer default 300
)
returns setof public.scan_runs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidates as (
    select sr.id
    from public.scan_runs sr
    where (
        (
          sr.status = 'queued'
          and (sr.next_attempt_at is null or sr.next_attempt_at <= timezone('utc', now()))
          and (sr.lease_expires_at is null or sr.lease_expires_at <= timezone('utc', now()))
        )
        or (
          sr.status = 'running'
          and sr.next_poll_at is not null
          and sr.next_poll_at <= timezone('utc', now())
          and (sr.lease_expires_at is null or sr.lease_expires_at <= timezone('utc', now()))
        )
        or (
          sr.status = 'running'
          and sr.lease_expires_at is not null
          and sr.lease_expires_at <= timezone('utc', now())
          and sr.next_poll_at is null
          and sr.completed_at is null
        )
      )
    order by coalesce(sr.next_poll_at, sr.next_attempt_at, sr.scheduled_for) asc
    for update of sr skip locked
    limit greatest(1, least(coalesce(p_limit, 10), 50))
  ),
  updated as (
    update public.scan_runs sr
    set
      status = 'running',
      claimed_at = timezone('utc', now()),
      claimed_by = p_worker_id,
      lease_expires_at = timezone('utc', now()) + make_interval(secs => greatest(30, coalesce(p_lease_seconds, 300))),
      started_at = coalesce(sr.started_at, timezone('utc', now())),
      attempt_count = case
        when sr.status = 'queued' then sr.attempt_count + 1
        else sr.attempt_count
      end,
      updated_at = timezone('utc', now())
    from candidates c
    where sr.id = c.id
    returning sr.*
  )
  select * from updated;
end;
$$;

create or replace function public.release_expired_scan_run_leases()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  released integer;
begin
  with updated as (
    update public.scan_runs
    set
      claimed_at = null,
      claimed_by = null,
      lease_expires_at = null,
      -- Keep running if awaiting poll; otherwise return to queued for retry.
      status = case
        when next_poll_at is not null and provider_task_id is not null then 'running'
        when status = 'running' and completed_at is null then 'queued'
        else status
      end,
      next_attempt_at = case
        when next_poll_at is null and status = 'running' and completed_at is null
          then timezone('utc', now())
        else next_attempt_at
      end,
      updated_at = timezone('utc', now())
    where lease_expires_at is not null
      and lease_expires_at <= timezone('utc', now())
      and completed_at is null
      and status in ('queued', 'running')
    returning 1
  )
  select count(*)::integer into released from updated;
  return coalesce(released, 0);
end;
$$;

create or replace function public.record_monitoring_usage_event(
  p_workspace_id uuid,
  p_scan_run_id uuid,
  p_metric_key public.monitoring_usage_metric_key,
  p_quantity numeric,
  p_billing_period_start timestamptz,
  p_billing_period_end timestamptz,
  p_source text default 'monitoring_engine'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer := 0;
begin
  insert into public.monitoring_usage_events (
    workspace_id,
    scan_run_id,
    metric_key,
    quantity,
    billing_period_start,
    billing_period_end,
    source
  )
  values (
    p_workspace_id,
    p_scan_run_id,
    p_metric_key,
    p_quantity,
    p_billing_period_start,
    p_billing_period_end,
    coalesce(p_source, 'monitoring_engine')
  )
  on conflict (scan_run_id, metric_key) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count > 0;
end;
$$;

revoke all on function public.claim_due_scan_runs(integer, text, integer) from public;
revoke all on function public.release_expired_scan_run_leases() from public;
revoke all on function public.record_monitoring_usage_event(uuid, uuid, public.monitoring_usage_metric_key, numeric, timestamptz, timestamptz, text) from public;

grant execute on function public.claim_due_scan_runs(integer, text, integer) to service_role;
grant execute on function public.release_expired_scan_run_leases() to service_role;
grant execute on function public.record_monitoring_usage_event(uuid, uuid, public.monitoring_usage_metric_key, numeric, timestamptz, timestamptz, text) to service_role;
