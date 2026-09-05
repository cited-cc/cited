-- Cited lifecycle automations: welcome nurture drip + Learn Domains day-21 promo.

do $$ begin
  alter type public.notification_unsubscribe_scope add value if not exists 'product_tips';
exception when duplicate_object then null;
end $$;

alter table public.user_notification_preferences
  add column if not exists product_tips_enabled boolean not null default true,
  add column if not exists product_tips_unsubscribed_at timestamptz;

alter table public.notification_preferences
  add column if not exists product_tips_email_enabled boolean not null default true;

create table if not exists public.lifecycle_email_enrollments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  sequence_key text not null
    check (sequence_key in ('welcome_nurture', 'learn_domains_promo')),
  anchor_at timestamptz not null,
  status text not null default 'active'
    check (status in ('active', 'completed', 'canceled')),
  canceled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint lifecycle_email_enrollments_workspace_sequence_unique
    unique (workspace_id, sequence_key)
);

create index if not exists lifecycle_email_enrollments_active_idx
  on public.lifecycle_email_enrollments (status, sequence_key, anchor_at)
  where status = 'active';

create table if not exists public.lifecycle_email_sends (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null
    references public.lifecycle_email_enrollments (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  step_key text not null,
  notification_type text not null,
  scheduled_for timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'queued', 'sent', 'suppressed', 'canceled', 'failed')),
  outbox_id uuid references public.notification_outbox (id) on delete set null,
  queued_at timestamptz,
  sent_at timestamptz,
  suppressed_at timestamptz,
  failure_code text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint lifecycle_email_sends_enrollment_step_unique
    unique (enrollment_id, step_key)
);

create index if not exists lifecycle_email_sends_due_idx
  on public.lifecycle_email_sends (status, scheduled_for)
  where status = 'pending';

create index if not exists lifecycle_email_sends_workspace_idx
  on public.lifecycle_email_sends (workspace_id, notification_type);

drop trigger if exists lifecycle_email_enrollments_set_updated_at
  on public.lifecycle_email_enrollments;
create trigger lifecycle_email_enrollments_set_updated_at
  before update on public.lifecycle_email_enrollments
  for each row execute function public.set_updated_at();

drop trigger if exists lifecycle_email_sends_set_updated_at
  on public.lifecycle_email_sends;
create trigger lifecycle_email_sends_set_updated_at
  before update on public.lifecycle_email_sends
  for each row execute function public.set_updated_at();

alter table public.lifecycle_email_enrollments enable row level security;
alter table public.lifecycle_email_sends enable row level security;

-- Service-role / admin client only. No direct client policies.
