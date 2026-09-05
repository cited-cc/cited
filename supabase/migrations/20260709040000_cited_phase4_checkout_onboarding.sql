-- Cited Phase 4: checkout intents, founder inventory, webhooks, onboarding, domain verification.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.checkout_intent_status as enum (
  'created',
  'reserved',
  'checkout_created',
  'checkout_completed',
  'provisioned',
  'expired',
  'canceled',
  'failed'
);

create type public.stripe_webhook_processing_status as enum (
  'received',
  'processed',
  'ignored',
  'failed'
);

create type public.domain_verification_attempt_status as enum (
  'success',
  'not_found',
  'mismatch',
  'rate_limited',
  'error'
);

create type public.monitor_activation_status as enum (
  'configured',
  'paused',
  'active'
);

-- ---------------------------------------------------------------------------
-- workspaces: billing period + onboarding timestamp
-- ---------------------------------------------------------------------------

alter table public.workspaces
  add column if not exists current_period_end timestamptz,
  add column if not exists billing_updated_at timestamptz,
  add column if not exists onboarding_completed_at timestamptz;

create index if not exists workspaces_stripe_customer_id_idx
  on public.workspaces (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists workspaces_stripe_subscription_id_idx
  on public.workspaces (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- ---------------------------------------------------------------------------
-- domains: verification attempt metadata
-- ---------------------------------------------------------------------------

alter table public.domains
  add column if not exists verification_token_rotated_at timestamptz,
  add column if not exists verification_attempt_count integer not null default 0
    check (verification_attempt_count >= 0),
  add column if not exists last_verification_error_code text;

-- ---------------------------------------------------------------------------
-- monitored_prompts / monitor_configurations: setup status
-- ---------------------------------------------------------------------------

alter table public.monitored_prompts
  add column if not exists setup_status text not null default 'configured'
    check (setup_status in ('draft', 'configured'));

alter table public.monitor_configurations
  add column if not exists configured_at timestamptz,
  add column if not exists activation_status public.monitor_activation_status
    not null default 'configured';

-- ---------------------------------------------------------------------------
-- checkout_intents
-- ---------------------------------------------------------------------------

create table public.checkout_intents (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  requested_plan_key public.plan_key not null,
  stripe_price_id_snapshot text not null,
  status public.checkout_intent_status not null default 'created',
  stripe_checkout_session_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  workspace_id uuid references public.workspaces (id) on delete set null,
  reservation_expires_at timestamptz,
  completed_at timestamptz,
  canceled_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint checkout_intents_paid_plan_check
    check (requested_plan_key in ('founder', 'growth', 'pro'))
);

create index checkout_intents_clerk_user_id_idx
  on public.checkout_intents (clerk_user_id);

create index checkout_intents_status_idx
  on public.checkout_intents (status);

create unique index checkout_intents_stripe_session_uidx
  on public.checkout_intents (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index checkout_intents_expires_at_idx
  on public.checkout_intents (expires_at)
  where expires_at is not null;

create index checkout_intents_reservation_expires_at_idx
  on public.checkout_intents (reservation_expires_at)
  where reservation_expires_at is not null;

create trigger checkout_intents_set_updated_at
  before update on public.checkout_intents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- plan_inventory (Founder capacity)
-- ---------------------------------------------------------------------------

create table public.plan_inventory (
  plan_key public.plan_key primary key,
  capacity integer not null check (capacity >= 0),
  active_count integer not null default 0 check (active_count >= 0),
  reserved_count integer not null default 0 check (reserved_count >= 0),
  updated_at timestamptz not null default timezone('utc', now()),
  -- Named distinctly: Postgres auto-names `check (capacity >= 0)` as
  -- plan_inventory_capacity_check.
  constraint plan_inventory_active_reserved_lte_capacity_check
    check (active_count + reserved_count <= capacity)
);

create trigger plan_inventory_set_updated_at
  before update on public.plan_inventory
  for each row execute function public.set_updated_at();

insert into public.plan_inventory (plan_key, capacity, active_count, reserved_count)
values ('founder', 100, 0, 0)
on conflict (plan_key) do nothing;

-- Release expired Founder reservations and expire their intents.
create or replace function public.release_expired_founder_reservations()
returns integer
language plpgsql
as $$
declare
  released integer := 0;
begin
  with expired as (
    update public.checkout_intents
    set
      status = 'expired',
      updated_at = timezone('utc', now())
    where requested_plan_key = 'founder'
      and status in ('reserved', 'checkout_created')
      and reservation_expires_at is not null
      and reservation_expires_at < timezone('utc', now())
    returning id
  )
  select count(*)::integer into released from expired;

  if released > 0 then
    update public.plan_inventory
    set
      reserved_count = greatest(0, reserved_count - released),
      updated_at = timezone('utc', now())
    where plan_key = 'founder';
  end if;

  return released;
end;
$$;

-- Atomically reserve one Founder slot for a checkout intent.
create or replace function public.reserve_founder_slot(
  p_intent_id uuid,
  p_ttl_minutes integer default 30
)
returns boolean
language plpgsql
as $$
declare
  available boolean := false;
begin
  perform public.release_expired_founder_reservations();

  update public.plan_inventory
  set
    reserved_count = reserved_count + 1,
    updated_at = timezone('utc', now())
  where plan_key = 'founder'
    and active_count + reserved_count < capacity
  returning true into available;

  if not coalesce(available, false) then
    return false;
  end if;

  update public.checkout_intents
  set
    status = 'reserved',
    reservation_expires_at = timezone('utc', now()) + make_interval(mins => greatest(p_ttl_minutes, 1)),
    expires_at = timezone('utc', now()) + make_interval(mins => greatest(p_ttl_minutes, 1)),
    updated_at = timezone('utc', now())
  where id = p_intent_id
    and status in ('created', 'failed', 'expired', 'canceled');

  if not found then
    update public.plan_inventory
    set
      reserved_count = greatest(0, reserved_count - 1),
      updated_at = timezone('utc', now())
    where plan_key = 'founder';
    return false;
  end if;

  return true;
end;
$$;

-- Convert a reserved Founder slot to an active customer (idempotent).
create or replace function public.activate_founder_reservation(
  p_intent_id uuid
)
returns boolean
language plpgsql
as $$
declare
  intent_row public.checkout_intents%rowtype;
begin
  select * into intent_row
  from public.checkout_intents
  where id = p_intent_id
  for update;

  if not found then
    return false;
  end if;

  if intent_row.requested_plan_key <> 'founder' then
    return true;
  end if;

  -- Already provisioned: do not double-count.
  if intent_row.status = 'provisioned' then
    return true;
  end if;

  if intent_row.status not in ('reserved', 'checkout_created', 'checkout_completed') then
    return false;
  end if;

  update public.plan_inventory
  set
    reserved_count = greatest(0, reserved_count - 1),
    active_count = active_count + 1,
    updated_at = timezone('utc', now())
  where plan_key = 'founder'
    and active_count < capacity;

  if not found then
    return false;
  end if;

  return true;
end;
$$;

-- Release a reservation that never completed (failed Stripe session, cancel).
create or replace function public.release_founder_reservation(
  p_intent_id uuid
)
returns boolean
language plpgsql
as $$
declare
  intent_row public.checkout_intents%rowtype;
begin
  select * into intent_row
  from public.checkout_intents
  where id = p_intent_id
  for update;

  if not found then
    return false;
  end if;

  if intent_row.requested_plan_key <> 'founder' then
    return true;
  end if;

  if intent_row.status not in ('reserved', 'checkout_created') then
    return false;
  end if;

  update public.plan_inventory
  set
    reserved_count = greatest(0, reserved_count - 1),
    updated_at = timezone('utc', now())
  where plan_key = 'founder';

  update public.checkout_intents
  set
    status = 'canceled',
    canceled_at = timezone('utc', now()),
    reservation_expires_at = null,
    updated_at = timezone('utc', now())
  where id = p_intent_id;

  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- stripe_webhook_events
-- ---------------------------------------------------------------------------

create table public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null,
  event_type text not null,
  processing_status public.stripe_webhook_processing_status not null default 'received',
  checkout_intent_id uuid references public.checkout_intents (id) on delete set null,
  workspace_id uuid references public.workspaces (id) on delete set null,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint stripe_webhook_events_event_id_unique unique (stripe_event_id)
);

create index stripe_webhook_events_event_type_idx
  on public.stripe_webhook_events (event_type);

create index stripe_webhook_events_processing_status_idx
  on public.stripe_webhook_events (processing_status);

create trigger stripe_webhook_events_set_updated_at
  before update on public.stripe_webhook_events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- workspace_onboarding
-- ---------------------------------------------------------------------------

create table public.workspace_onboarding (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  current_step integer not null default 1
    check (current_step >= 1 and current_step <= 5),
  completed_at timestamptz,
  dismissed_at timestamptz,
  selected_plan_key_snapshot public.plan_key,
  setup_started_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workspace_onboarding_workspace_unique unique (workspace_id)
);

create index workspace_onboarding_workspace_id_idx
  on public.workspace_onboarding (workspace_id);

create trigger workspace_onboarding_set_updated_at
  before update on public.workspace_onboarding
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- domain_verification_attempts
-- ---------------------------------------------------------------------------

create table public.domain_verification_attempts (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  method public.domain_verification_method not null default 'dns_txt',
  status public.domain_verification_attempt_status not null,
  attempted_at timestamptz not null default timezone('utc', now()),
  failure_code text,
  created_at timestamptz not null default timezone('utc', now())
);

create index domain_verification_attempts_domain_id_idx
  on public.domain_verification_attempts (domain_id);

create index domain_verification_attempts_workspace_id_idx
  on public.domain_verification_attempts (workspace_id);

create index domain_verification_attempts_attempted_at_idx
  on public.domain_verification_attempts (workspace_id, attempted_at desc);

-- ---------------------------------------------------------------------------
-- RLS: deny-by-default (service-role admin client after Clerk checks)
-- ---------------------------------------------------------------------------

alter table public.checkout_intents enable row level security;
alter table public.plan_inventory enable row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.workspace_onboarding enable row level security;
alter table public.domain_verification_attempts enable row level security;
