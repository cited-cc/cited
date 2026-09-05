-- Phase 8: monitoring provider registry metadata on provider_tasks

alter table public.provider_tasks
  add column if not exists adapter_version text,
  add column if not exists normalization_version text,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists error_code text,
  add column if not exists diagnostic_id text,
  add column if not exists failed_at timestamptz,
  add column if not exists canceled_at timestamptz,
  add column if not exists next_poll_at timestamptz,
  add column if not exists provider_usage jsonb not null default '{}'::jsonb;

create index if not exists provider_tasks_next_poll_idx
  on public.provider_tasks (status, next_poll_at)
  where status in ('submitted', 'pending') and next_poll_at is not null;

comment on column public.provider_tasks.adapter_version is
  'Registered monitoring adapter version at submission time.';
comment on column public.provider_tasks.normalization_version is
  'Normalized provider result schema version at submission time.';
comment on column public.provider_tasks.provider_usage is
  'Safe provider-reported usage metadata. Never store credentials.';
