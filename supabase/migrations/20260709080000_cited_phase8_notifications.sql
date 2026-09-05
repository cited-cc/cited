-- Cited Phase 8: notification preferences, outbox delivery, digests, unsubscribe.

-- ---------------------------------------------------------------------------
-- Enum extensions / new enums
-- ---------------------------------------------------------------------------

alter type public.notification_outbox_status add value if not exists 'partially_delivered';
alter type public.notification_outbox_status add value if not exists 'suppressed';

do $$ begin
  create type public.notification_priority as enum ('low', 'normal', 'high');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_channel as enum ('email', 'slack');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_delivery_status as enum (
    'pending',
    'processing',
    'delivered',
    'failed',
    'suppressed',
    'canceled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_recipient_type as enum (
    'workspace_owner',
    'workspace_admin',
    'workspace_member',
    'slack_workspace',
    'free_scan_requester'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_unsubscribe_scope as enum (
    'all_email',
    'instant_alerts',
    'weekly_digest',
    'monitor_issues',
    'free_scan_followup'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_digest_run_status as enum (
    'pending',
    'queued',
    'sent',
    'suppressed',
    'failed'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Extend notification_preferences (workspace-level)
-- ---------------------------------------------------------------------------

alter table public.notification_preferences
  add column if not exists instant_email_enabled boolean,
  add column if not exists instant_slack_enabled boolean not null default false,
  add column if not exists weekly_digest_email_enabled boolean,
  add column if not exists weekly_digest_slack_enabled boolean not null default false,
  add column if not exists monitor_issue_email_enabled boolean not null default true,
  add column if not exists monitor_issue_slack_enabled boolean not null default false,
  add column if not exists recurring_citation_alerts_enabled boolean not null default false,
  add column if not exists send_empty_digest boolean not null default false,
  add column if not exists digest_weekday smallint not null default 1
    check (digest_weekday >= 0 and digest_weekday <= 6),
  add column if not exists digest_hour smallint not null default 9
    check (digest_hour >= 0 and digest_hour <= 23),
  add column if not exists digest_timezone text not null default 'UTC',
  add column if not exists slack_webhook_configured_at timestamptz,
  add column if not exists slack_last_tested_at timestamptz,
  add column if not exists slack_last_success_at timestamptz,
  add column if not exists slack_last_failure_at timestamptz,
  add column if not exists slack_last_failure_code text,
  add column if not exists slack_status text not null default 'not_connected'
    check (slack_status in ('not_connected', 'connected', 'needs_attention'));

-- Backfill from legacy columns.
update public.notification_preferences
set
  instant_email_enabled = coalesce(instant_email_enabled, instant_citation_alerts_enabled, email_enabled, true),
  weekly_digest_email_enabled = coalesce(weekly_digest_email_enabled, weekly_digest_enabled, true),
  instant_slack_enabled = coalesce(instant_slack_enabled, false),
  weekly_digest_slack_enabled = coalesce(weekly_digest_slack_enabled, false)
where true;

alter table public.notification_preferences
  alter column instant_email_enabled set default true,
  alter column instant_email_enabled set not null,
  alter column weekly_digest_email_enabled set default true,
  alter column weekly_digest_email_enabled set not null;

-- Keep legacy columns in sync via generated defaults for existing writers.
-- Writers should prefer the new columns; legacy columns remain for compatibility.

-- ---------------------------------------------------------------------------
-- user_notification_preferences
-- ---------------------------------------------------------------------------

create table if not exists public.user_notification_preferences (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  clerk_user_id text not null,
  email_alerts_enabled boolean not null default true,
  weekly_digest_enabled boolean not null default true,
  monitor_issue_alerts_enabled boolean not null default true,
  slack_mentions_enabled boolean not null default false,
  unsubscribed_all_at timestamptz,
  email_unsubscribed_at timestamptz,
  digest_unsubscribed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_notification_preferences_unique
    unique (workspace_id, clerk_user_id)
);

create index if not exists user_notification_preferences_workspace_idx
  on public.user_notification_preferences (workspace_id);

create trigger user_notification_preferences_set_updated_at
  before update on public.user_notification_preferences
  for each row execute function public.set_updated_at();

alter table public.user_notification_preferences enable row level security;

-- ---------------------------------------------------------------------------
-- Enhance notification_outbox
-- ---------------------------------------------------------------------------

alter table public.notification_outbox
  add column if not exists notification_type text,
  add column if not exists dedupe_key text,
  add column if not exists priority public.notification_priority not null default 'normal',
  add column if not exists locked_at timestamptz,
  add column if not exists lock_expires_at timestamptz,
  add column if not exists attempt_count integer not null default 0
    check (attempt_count >= 0),
  add column if not exists max_attempts integer not null default 5
    check (max_attempts >= 1),
  add column if not exists last_attempt_at timestamptz,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists canceled_at timestamptz,
  add column if not exists failure_code text,
  add column if not exists failure_message text,
  add column if not exists payload_summary jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

-- Backfill notification_type and dedupe_key from legacy columns.
update public.notification_outbox
set
  notification_type = coalesce(notification_type, event_type),
  dedupe_key = coalesce(
    dedupe_key,
    workspace_id::text || ':' || event_type || ':' || source_entity_type || ':' || source_entity_id
  ),
  payload_summary = case
    when payload_summary = '{}'::jsonb and payload is not null then payload
    else payload_summary
  end
where notification_type is null or dedupe_key is null;

alter table public.notification_outbox
  alter column notification_type set not null;

-- Unique dedupe per workspace (preferred). Keep legacy unique for compatibility.
create unique index if not exists notification_outbox_dedupe_key_unique
  on public.notification_outbox (workspace_id, dedupe_key);

create index if not exists notification_outbox_claim_idx
  on public.notification_outbox (status, available_at, next_attempt_at)
  where status in ('pending', 'processing');

create trigger notification_outbox_set_updated_at
  before update on public.notification_outbox
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- notification_deliveries
-- ---------------------------------------------------------------------------

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  outbox_id uuid not null references public.notification_outbox (id) on delete cascade,
  channel public.notification_channel not null,
  recipient_type public.notification_recipient_type not null,
  recipient_clerk_user_id text,
  recipient_email_hash text,
  status public.notification_delivery_status not null default 'pending',
  provider text,
  provider_message_id text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  failure_code text,
  failure_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  -- Enum::text is not IMMUTABLE, so avoid generated columns for uniqueness.
  -- NULLS NOT DISTINCT treats null clerk ids as equal for the same recipient_type.
  constraint notification_deliveries_unique
    unique nulls not distinct (outbox_id, channel, recipient_type, recipient_clerk_user_id)
);

create index if not exists notification_deliveries_workspace_idx
  on public.notification_deliveries (workspace_id, created_at desc);

create index if not exists notification_deliveries_outbox_idx
  on public.notification_deliveries (outbox_id, status);

create trigger notification_deliveries_set_updated_at
  before update on public.notification_deliveries
  for each row execute function public.set_updated_at();

alter table public.notification_deliveries enable row level security;

-- ---------------------------------------------------------------------------
-- notification_unsubscribe_tokens
-- ---------------------------------------------------------------------------

create table if not exists public.notification_unsubscribe_tokens (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  clerk_user_id text,
  email_hash text not null,
  token_hash text not null,
  scope public.notification_unsubscribe_scope not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint notification_unsubscribe_tokens_hash_unique unique (token_hash)
);

create index if not exists notification_unsubscribe_tokens_lookup_idx
  on public.notification_unsubscribe_tokens (token_hash, expires_at);

create index if not exists notification_unsubscribe_tokens_workspace_idx
  on public.notification_unsubscribe_tokens (workspace_id, clerk_user_id);

alter table public.notification_unsubscribe_tokens enable row level security;

-- ---------------------------------------------------------------------------
-- notification_digest_runs
-- ---------------------------------------------------------------------------

create table if not exists public.notification_digest_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  channel public.notification_channel not null,
  status public.notification_digest_run_status not null default 'pending',
  outbox_id uuid references public.notification_outbox (id) on delete set null,
  sent_at timestamptz,
  suppressed_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint notification_digest_runs_period_check check (period_end > period_start),
  constraint notification_digest_runs_unique
    unique (workspace_id, period_start, period_end, channel)
);

create index if not exists notification_digest_runs_workspace_idx
  on public.notification_digest_runs (workspace_id, period_end desc);

create trigger notification_digest_runs_set_updated_at
  before update on public.notification_digest_runs
  for each row execute function public.set_updated_at();

alter table public.notification_digest_runs enable row level security;

-- ---------------------------------------------------------------------------
-- Claim / release helpers for notification outbox
-- ---------------------------------------------------------------------------

create or replace function public.claim_notification_outbox(
  p_limit integer,
  p_lease_seconds integer default 900
)
returns setof public.notification_outbox
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_lease_expires timestamptz := v_now + make_interval(secs => greatest(p_lease_seconds, 60));
begin
  return query
  with candidates as (
    select o.id
    from public.notification_outbox o
    where (
      o.status = 'pending'
      and o.available_at <= v_now
      and (o.next_attempt_at is null or o.next_attempt_at <= v_now)
    )
    or (
      o.status = 'processing'
      and o.lock_expires_at is not null
      and o.lock_expires_at <= v_now
    )
    order by
      case o.priority
        when 'high' then 0
        when 'normal' then 1
        else 2
      end,
      o.available_at asc,
      o.created_at asc
    limit greatest(p_limit, 1)
    for update of o skip locked
  ),
  claimed as (
    update public.notification_outbox o
    set
      status = 'processing',
      locked_at = v_now,
      lock_expires_at = v_lease_expires,
      last_attempt_at = v_now,
      attempt_count = o.attempt_count + 1,
      updated_at = v_now
    from candidates c
    where o.id = c.id
    returning o.*
  )
  select * from claimed;
end;
$$;

revoke all on function public.claim_notification_outbox(integer, integer) from public;
grant execute on function public.claim_notification_outbox(integer, integer) to service_role;

create or replace function public.release_stale_notification_outbox_locks()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with released as (
    update public.notification_outbox
    set
      status = 'pending',
      locked_at = null,
      lock_expires_at = null,
      updated_at = timezone('utc', now())
    where status = 'processing'
      and lock_expires_at is not null
      and lock_expires_at <= timezone('utc', now())
    returning id
  )
  select count(*)::integer into v_count from released;
  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.release_stale_notification_outbox_locks() from public;
grant execute on function public.release_stale_notification_outbox_locks() to service_role;
