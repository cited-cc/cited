-- Cited Phase 9: monitoring lifecycle hardening, competitors, config snapshots.

-- ---------------------------------------------------------------------------
-- competitor_hostnames
-- ---------------------------------------------------------------------------

create table if not exists public.competitor_hostnames (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  domain_id uuid references public.domains (id) on delete cascade,
  monitor_configuration_id uuid references public.monitor_configurations (id) on delete cascade,
  normalized_hostname text not null,
  display_hostname text,
  brand_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint competitor_hostnames_hostname_len check (
    char_length(normalized_hostname) >= 3 and char_length(normalized_hostname) <= 253
  )
);

create unique index if not exists competitor_hostnames_scope_host_uidx
  on public.competitor_hostnames (
    workspace_id,
    normalized_hostname,
    coalesce(monitor_configuration_id::text, ''),
    coalesce(domain_id::text, '')
  );

create index if not exists competitor_hostnames_workspace_idx
  on public.competitor_hostnames (workspace_id);

create index if not exists competitor_hostnames_monitor_idx
  on public.competitor_hostnames (monitor_configuration_id)
  where monitor_configuration_id is not null;

create trigger competitor_hostnames_set_updated_at
  before update on public.competitor_hostnames
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- monitor_config_snapshots (immutable per scan)
-- ---------------------------------------------------------------------------

create table if not exists public.monitor_config_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  monitor_configuration_id uuid not null references public.monitor_configurations (id) on delete cascade,
  version integer not null check (version >= 1),
  classification_version text not null,
  configuration jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists monitor_config_snapshots_monitor_idx
  on public.monitor_config_snapshots (monitor_configuration_id, created_at desc);

create index if not exists monitor_config_snapshots_workspace_idx
  on public.monitor_config_snapshots (workspace_id);

-- ---------------------------------------------------------------------------
-- scan_runs: lifecycle phase + snapshot reference
-- ---------------------------------------------------------------------------

alter table public.scan_runs
  add column if not exists config_snapshot_id uuid references public.monitor_config_snapshots (id),
  add column if not exists phase text,
  add column if not exists last_transition_at timestamptz,
  add column if not exists last_transition_reason text;

create index if not exists scan_runs_config_snapshot_idx
  on public.scan_runs (config_snapshot_id)
  where config_snapshot_id is not null;

-- ---------------------------------------------------------------------------
-- provider_tasks: submission ambiguity tracking
-- ---------------------------------------------------------------------------

alter table public.provider_tasks
  add column if not exists submission_state text,
  add column if not exists external_request_key text,
  add column if not exists submission_intent_at timestamptz;

create unique index if not exists provider_tasks_external_request_key_uidx
  on public.provider_tasks (external_request_key)
  where external_request_key is not null;
