-- Phase 10: integration handoff audit + setup checklist dismissal

create table if not exists public.integration_handoffs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  integration text not null,
  source_entity_type text not null,
  source_entity_id uuid not null,
  created_by_clerk_user_id text not null,
  payload_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint integration_handoffs_integration_check
    check (integration in ('learn_domains')),
  constraint integration_handoffs_source_entity_type_check
    check (
      source_entity_type in ('citation_event', 'monitor_configuration')
    )
);

create index if not exists integration_handoffs_workspace_created_idx
  on public.integration_handoffs (workspace_id, created_at desc);

alter table public.integration_handoffs enable row level security;

create table if not exists public.member_ui_preferences (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  clerk_user_id text not null,
  setup_checklist_dismissed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, clerk_user_id)
);

create index if not exists member_ui_preferences_workspace_user_idx
  on public.member_ui_preferences (workspace_id, clerk_user_id);

alter table public.member_ui_preferences enable row level security;
