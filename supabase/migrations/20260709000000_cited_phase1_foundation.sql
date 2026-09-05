-- Cited Phase 1 foundational data model
-- Multi-tenant workspace architecture with citation monitoring primitives.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.workspace_status as enum (
  'active',
  'trialing',
  'past_due',
  'canceled',
  'suspended'
);

create type public.plan_key as enum (
  'free',
  'founder',
  'growth',
  'pro',
  'enterprise'
);

create type public.workspace_role as enum (
  'owner',
  'admin',
  'member',
  'viewer'
);

create type public.domain_verification_status as enum (
  'pending',
  'verified',
  'failed',
  'disabled'
);

create type public.domain_verification_method as enum (
  'dns_txt',
  'meta_tag',
  'file_upload',
  'manual'
);

create type public.domain_alias_type as enum (
  'www_variant',
  'subdomain',
  'redirected_domain',
  'brand_domain',
  'manual'
);

create type public.monitoring_frequency as enum (
  'twice_weekly',
  'weekly',
  'daily',
  'manual'
);

create type public.prompt_priority as enum (
  'low',
  'normal',
  'high',
  'critical'
);

create type public.ai_surface_key as enum (
  'chatgpt',
  'gemini',
  'google_ai_overviews',
  'perplexity',
  'claude'
);

create type public.scan_run_status as enum (
  'queued',
  'running',
  'completed',
  'partial',
  'failed',
  'canceled'
);

create type public.citation_event_type as enum (
  'citation',
  'mention',
  'recommendation',
  'competitor_citation',
  'missed_opportunity'
);

create type public.citation_event_status as enum (
  'new',
  'seen',
  'saved',
  'archived',
  'resolved'
);

create type public.citation_evidence_type as enum (
  'source_link',
  'response_excerpt',
  'brand_match',
  'domain_match',
  'recommendation_excerpt',
  'competitor_match'
);

create type public.usage_metric_key as enum (
  'domains',
  'active_prompts',
  'active_monitors',
  'monthly_scans',
  'team_members',
  'notebook_entries'
);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- workspaces
-- ---------------------------------------------------------------------------

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  owner_clerk_user_id text not null,
  plan_key public.plan_key not null default 'free',
  status public.workspace_status not null default 'trialing',
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workspaces_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint workspaces_slug_unique unique (slug)
);

create index workspaces_owner_clerk_user_id_idx
  on public.workspaces (owner_clerk_user_id);

create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- workspace_members
-- ---------------------------------------------------------------------------

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  clerk_user_id text not null,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workspace_members_unique unique (workspace_id, clerk_user_id)
);

create index workspace_members_clerk_user_id_idx
  on public.workspace_members (clerk_user_id);

create trigger workspace_members_set_updated_at
  before update on public.workspace_members
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- domains
-- ---------------------------------------------------------------------------

create table public.domains (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  hostname text not null,
  normalized_hostname text not null,
  display_name text,
  verification_status public.domain_verification_status not null default 'pending',
  verification_method public.domain_verification_method,
  verification_token text,
  verified_at timestamptz,
  last_checked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint domains_normalized_hostname_unique unique (workspace_id, normalized_hostname)
);

create index domains_workspace_id_idx on public.domains (workspace_id);

create trigger domains_set_updated_at
  before update on public.domains
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- domain_aliases
-- ---------------------------------------------------------------------------

create table public.domain_aliases (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains (id) on delete cascade,
  hostname text not null,
  normalized_hostname text not null,
  alias_type public.domain_alias_type not null default 'manual',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint domain_aliases_normalized_unique unique (domain_id, normalized_hostname)
);

create index domain_aliases_domain_id_idx on public.domain_aliases (domain_id);

create trigger domain_aliases_set_updated_at
  before update on public.domain_aliases
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- brands
-- ---------------------------------------------------------------------------

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  primary_domain_id uuid references public.domains (id) on delete set null,
  name text not null,
  normalized_name text not null,
  alternate_names text[] not null default '{}',
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint brands_normalized_name_unique unique (workspace_id, normalized_name)
);

create index brands_workspace_id_idx on public.brands (workspace_id);

create trigger brands_set_updated_at
  before update on public.brands
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- monitored_prompts
-- ---------------------------------------------------------------------------

create table public.monitored_prompts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  domain_id uuid not null references public.domains (id) on delete cascade,
  name text not null,
  prompt_text text not null,
  normalized_prompt text not null,
  locale text,
  language_code text,
  country_code text,
  city text,
  active boolean not null default true,
  monitoring_frequency public.monitoring_frequency not null default 'manual',
  priority public.prompt_priority not null default 'normal',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index monitored_prompts_workspace_id_idx
  on public.monitored_prompts (workspace_id);

create index monitored_prompts_domain_id_idx
  on public.monitored_prompts (domain_id);

-- Prevent duplicate active prompts for the same workspace/domain/location combo.
create unique index monitored_prompts_active_dedupe_idx
  on public.monitored_prompts (
    workspace_id,
    domain_id,
    normalized_prompt,
    coalesce(locale, ''),
    coalesce(language_code, ''),
    coalesce(country_code, ''),
    coalesce(city, '')
  )
  where active = true;

create trigger monitored_prompts_set_updated_at
  before update on public.monitored_prompts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ai_surfaces (reference / feature-flag metadata)
-- ---------------------------------------------------------------------------

create table public.ai_surfaces (
  key public.ai_surface_key primary key,
  display_name text not null,
  category text not null,
  supports_citations boolean not null default true,
  supports_mentions boolean not null default true,
  supports_location boolean not null default false,
  supports_scheduled_monitoring boolean not null default false,
  status text not null default 'planned'
    check (status in ('planned', 'beta', 'ga', 'disabled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger ai_surfaces_set_updated_at
  before update on public.ai_surfaces
  for each row execute function public.set_updated_at();

insert into public.ai_surfaces (
  key,
  display_name,
  category,
  supports_citations,
  supports_mentions,
  supports_location,
  supports_scheduled_monitoring,
  status
) values
  ('chatgpt', 'ChatGPT', 'chat', true, true, true, true, 'planned'),
  ('gemini', 'Gemini', 'chat', true, true, true, true, 'planned'),
  ('google_ai_overviews', 'Google AI Overviews', 'search', true, true, true, true, 'planned'),
  ('perplexity', 'Perplexity', 'search', true, true, true, true, 'planned'),
  ('claude', 'Claude', 'chat', true, true, false, true, 'planned');

-- ---------------------------------------------------------------------------
-- monitor_configurations
-- ---------------------------------------------------------------------------

create table public.monitor_configurations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  monitored_prompt_id uuid not null references public.monitored_prompts (id) on delete cascade,
  ai_surface public.ai_surface_key not null references public.ai_surfaces (key),
  enabled boolean not null default true,
  scan_frequency public.monitoring_frequency not null default 'manual',
  locale text,
  country_code text,
  city text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index monitor_configurations_unique_idx
  on public.monitor_configurations (
    monitored_prompt_id,
    ai_surface,
    coalesce(locale, ''),
    coalesce(country_code, ''),
    coalesce(city, '')
  );

create index monitor_configurations_workspace_id_idx
  on public.monitor_configurations (workspace_id);

create trigger monitor_configurations_set_updated_at
  before update on public.monitor_configurations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- scan_runs
-- ---------------------------------------------------------------------------

create table public.scan_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  monitor_configuration_id uuid not null references public.monitor_configurations (id) on delete cascade,
  status public.scan_run_status not null default 'queued',
  requested_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  completed_at timestamptz,
  provider text not null default 'dataforseo',
  provider_task_id text,
  provider_cost_usd numeric(12, 6),
  response_hash text,
  failure_code text,
  failure_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index scan_runs_workspace_id_idx on public.scan_runs (workspace_id);
create index scan_runs_monitor_configuration_id_idx
  on public.scan_runs (monitor_configuration_id);
create index scan_runs_status_idx on public.scan_runs (status);

create trigger scan_runs_set_updated_at
  before update on public.scan_runs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ai_responses (append-only evidence snapshots)
-- ---------------------------------------------------------------------------

create table public.ai_responses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  scan_run_id uuid not null references public.scan_runs (id) on delete cascade,
  ai_surface public.ai_surface_key not null references public.ai_surfaces (key),
  prompt_text_snapshot text not null,
  response_text text not null,
  response_language text,
  response_hash text not null,
  model_name text,
  location_snapshot jsonb not null default '{}'::jsonb,
  raw_provider_payload jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint ai_responses_scan_run_unique unique (scan_run_id)
);

create index ai_responses_workspace_id_idx on public.ai_responses (workspace_id);

create trigger ai_responses_set_updated_at
  before update on public.ai_responses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- citation_events
-- ---------------------------------------------------------------------------

create table public.citation_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  domain_id uuid references public.domains (id) on delete set null,
  brand_id uuid references public.brands (id) on delete set null,
  scan_run_id uuid not null references public.scan_runs (id) on delete cascade,
  ai_response_id uuid not null references public.ai_responses (id) on delete cascade,
  event_type public.citation_event_type not null,
  status public.citation_event_status not null default 'new',
  cited_hostname text,
  cited_url text,
  cited_url_normalized text,
  source_title text,
  source_snippet text,
  citation_position integer,
  confidence_score numeric(5, 4) not null default 0
    check (confidence_score >= 0 and confidence_score <= 1),
  first_seen_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index citation_events_workspace_id_idx
  on public.citation_events (workspace_id);
create index citation_events_event_type_idx
  on public.citation_events (event_type);
create index citation_events_status_idx
  on public.citation_events (status);
create index citation_events_ai_response_id_idx
  on public.citation_events (ai_response_id);

create trigger citation_events_set_updated_at
  before update on public.citation_events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- citation_evidence
-- ---------------------------------------------------------------------------

create table public.citation_evidence (
  id uuid primary key default gen_random_uuid(),
  citation_event_id uuid not null references public.citation_events (id) on delete cascade,
  evidence_type public.citation_evidence_type not null,
  evidence_text text,
  evidence_url text,
  evidence_position integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index citation_evidence_citation_event_id_idx
  on public.citation_evidence (citation_event_id);

-- ---------------------------------------------------------------------------
-- notebook_entries
-- ---------------------------------------------------------------------------

create table public.notebook_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  citation_event_id uuid references public.citation_events (id) on delete set null,
  author_clerk_user_id text not null,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index notebook_entries_workspace_id_idx
  on public.notebook_entries (workspace_id);

create trigger notebook_entries_set_updated_at
  before update on public.notebook_entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- notification_preferences
-- ---------------------------------------------------------------------------

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email_enabled boolean not null default true,
  weekly_digest_enabled boolean not null default true,
  instant_citation_alerts_enabled boolean not null default true,
  competitor_alerts_enabled boolean not null default false,
  missed_opportunity_alerts_enabled boolean not null default true,
  slack_enabled boolean not null default false,
  slack_webhook_url_encrypted text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint notification_preferences_workspace_unique unique (workspace_id)
);

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- workspace_usage
-- ---------------------------------------------------------------------------

create table public.workspace_usage (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  metric_key public.usage_metric_key not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  usage_count integer not null default 0 check (usage_count >= 0),
  limit_count integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workspace_usage_period_check check (period_end > period_start),
  constraint workspace_usage_unique unique (workspace_id, metric_key, period_start, period_end)
);

create index workspace_usage_workspace_id_idx
  on public.workspace_usage (workspace_id);

create trigger workspace_usage_set_updated_at
  before update on public.workspace_usage
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: deny-by-default. Application access uses the service-role admin client
-- with explicit workspace membership checks in application code (Clerk auth).
-- ---------------------------------------------------------------------------

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.domains enable row level security;
alter table public.domain_aliases enable row level security;
alter table public.brands enable row level security;
alter table public.monitored_prompts enable row level security;
alter table public.ai_surfaces enable row level security;
alter table public.monitor_configurations enable row level security;
alter table public.scan_runs enable row level security;
alter table public.ai_responses enable row level security;
alter table public.citation_events enable row level security;
alter table public.citation_evidence enable row level security;
alter table public.notebook_entries enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.workspace_usage enable row level security;

-- ai_surfaces is reference data; allow authenticated read via anon/authenticated
-- only if Data API is used later. For Phase 1, no policies = no client access.
-- Service role bypasses RLS for server-side operations.
