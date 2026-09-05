-- Cited Phase 6: per-member Inbox triage state, activity audit, search indexes.
-- Event evidence remains workspace-scoped on citation_events.
-- Seen / saved / archived / resolved are personal to each workspace member.

-- ---------------------------------------------------------------------------
-- Member triage state
-- ---------------------------------------------------------------------------

create table public.citation_event_member_states (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  citation_event_id uuid not null references public.citation_events (id) on delete cascade,
  clerk_user_id text not null,
  seen_at timestamptz,
  saved_at timestamptz,
  archived_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint citation_event_member_states_event_user_uidx
    unique (citation_event_id, clerk_user_id)
);

create index citation_event_member_states_workspace_id_idx
  on public.citation_event_member_states (workspace_id);

create index citation_event_member_states_clerk_user_id_idx
  on public.citation_event_member_states (clerk_user_id);

create index citation_event_member_states_citation_event_id_idx
  on public.citation_event_member_states (citation_event_id);

create index citation_event_member_states_unseen_idx
  on public.citation_event_member_states (workspace_id, clerk_user_id)
  where seen_at is null;

create index citation_event_member_states_saved_idx
  on public.citation_event_member_states (workspace_id, clerk_user_id)
  where saved_at is not null;

create index citation_event_member_states_archived_idx
  on public.citation_event_member_states (workspace_id, clerk_user_id)
  where archived_at is not null;

create index citation_event_member_states_resolved_idx
  on public.citation_event_member_states (workspace_id, clerk_user_id)
  where resolved_at is not null;

create trigger citation_event_member_states_set_updated_at
  before update on public.citation_event_member_states
  for each row execute function public.set_updated_at();

-- Keep workspace_id aligned with the parent citation event.
create or replace function public.citation_event_member_states_enforce_workspace()
returns trigger
language plpgsql
as $$
declare
  event_workspace_id uuid;
begin
  select workspace_id into event_workspace_id
  from public.citation_events
  where id = new.citation_event_id;

  if event_workspace_id is null then
    raise exception 'citation_event_member_states: citation event not found';
  end if;

  if new.workspace_id is distinct from event_workspace_id then
    raise exception 'citation_event_member_states: workspace_id must match citation event';
  end if;

  return new;
end;
$$;

create trigger citation_event_member_states_enforce_workspace
  before insert or update on public.citation_event_member_states
  for each row execute function public.citation_event_member_states_enforce_workspace();

alter table public.citation_event_member_states enable row level security;

-- ---------------------------------------------------------------------------
-- Optional lightweight activity trail (no PII / response contents)
-- ---------------------------------------------------------------------------

create type public.citation_event_member_action as enum (
  'seen',
  'saved',
  'unsaved',
  'archived',
  'restored',
  'resolved',
  'reopened'
);

create table public.citation_event_member_activity (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  citation_event_id uuid not null references public.citation_events (id) on delete cascade,
  clerk_user_id text not null,
  action public.citation_event_member_action not null,
  created_at timestamptz not null default now()
);

create index citation_event_member_activity_workspace_id_idx
  on public.citation_event_member_activity (workspace_id);

create index citation_event_member_activity_event_id_idx
  on public.citation_event_member_activity (citation_event_id);

create index citation_event_member_activity_user_created_idx
  on public.citation_event_member_activity (clerk_user_id, created_at desc);

alter table public.citation_event_member_activity enable row level security;

-- ---------------------------------------------------------------------------
-- Inbox list / filter / search indexes on citation_events
-- ---------------------------------------------------------------------------

create index if not exists citation_events_workspace_type_last_seen_idx
  on public.citation_events (workspace_id, event_type, last_seen_at desc);

create index if not exists citation_events_workspace_surface_last_seen_idx
  on public.citation_events (workspace_id, ai_surface, last_seen_at desc)
  where ai_surface is not null;

create index if not exists citation_events_workspace_domain_last_seen_idx
  on public.citation_events (workspace_id, domain_id, last_seen_at desc)
  where domain_id is not null;

create index if not exists citation_events_workspace_monitor_last_seen_idx
  on public.citation_events (workspace_id, monitor_configuration_id, last_seen_at desc)
  where monitor_configuration_id is not null;

-- Safe search vector over evidence-facing fields only (never raw provider payload).
alter table public.citation_events
  add column if not exists search_document tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(cited_hostname, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(source_title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(cited_url, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(source_snippet, '')), 'B')
  ) stored;

create index if not exists citation_events_search_document_idx
  on public.citation_events using gin (search_document);

comment on table public.citation_event_member_states is
  'Per-member Inbox triage state. Distinct from citation_events.status (legacy workspace-level compatibility field).';

comment on table public.citation_event_member_activity is
  'Append-only triage actions. Stores action labels only; never prompt or response text.';

comment on column public.citation_events.status is
  'Legacy workspace-level status retained for compatibility. Inbox triage uses citation_event_member_states.';

comment on column public.citation_events.search_document is
  'Generated tsvector for Inbox search over hostname, title, URL, and snippet only.';

-- ---------------------------------------------------------------------------
-- Inbox list RPC (member-scoped filters + cursor pagination)
-- ---------------------------------------------------------------------------

create or replace function public.inbox_list_events(
  p_workspace_id uuid,
  p_clerk_user_id text,
  p_view text default 'all',
  p_event_types public.citation_event_type[] default null,
  p_surfaces public.ai_surface_key[] default null,
  p_domain_id uuid default null,
  p_prompt_id uuid default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_member_states text[] default null,
  p_has_source boolean default null,
  p_search text default null,
  p_cursor_last_seen_at timestamptz default null,
  p_cursor_id uuid default null,
  p_limit integer default 25
)
returns table (
  id uuid,
  workspace_id uuid,
  domain_id uuid,
  brand_id uuid,
  scan_run_id uuid,
  ai_response_id uuid,
  event_type public.citation_event_type,
  status public.citation_event_status,
  cited_hostname text,
  cited_url text,
  cited_url_normalized text,
  source_title text,
  source_snippet text,
  citation_position integer,
  confidence_score numeric,
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  monitor_configuration_id uuid,
  event_fingerprint text,
  ai_surface public.ai_surface_key,
  occurrence_count integer,
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  member_seen_at timestamptz,
  member_saved_at timestamptz,
  member_archived_at timestamptz,
  member_resolved_at timestamptz,
  prompt_id uuid,
  prompt_text text,
  domain_hostname text
)
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select
      e.*,
      ms.seen_at as member_seen_at,
      ms.saved_at as member_saved_at,
      ms.archived_at as member_archived_at,
      ms.resolved_at as member_resolved_at,
      mp.id as prompt_id,
      mp.prompt_text as prompt_text,
      d.hostname as domain_hostname
    from public.citation_events e
    left join public.citation_event_member_states ms
      on ms.citation_event_id = e.id
     and ms.clerk_user_id = p_clerk_user_id
     and ms.workspace_id = p_workspace_id
    left join public.monitor_configurations mc
      on mc.id = e.monitor_configuration_id
     and mc.workspace_id = p_workspace_id
    left join public.monitored_prompts mp
      on mp.id = mc.monitored_prompt_id
     and mp.workspace_id = p_workspace_id
    left join public.domains d
      on d.id = e.domain_id
     and d.workspace_id = p_workspace_id
    where e.workspace_id = p_workspace_id
      and (
        case p_view
          when 'archived' then ms.archived_at is not null
          when 'saved' then ms.saved_at is not null
          when 'new' then ms.seen_at is null and ms.archived_at is null
          when 'citations' then e.event_type = 'citation' and ms.archived_at is null
          when 'mentions' then e.event_type = 'mention' and ms.archived_at is null
          when 'recommendations' then e.event_type = 'recommendation' and ms.archived_at is null
          when 'opportunities' then e.event_type in ('missed_opportunity', 'competitor_citation')
            and ms.archived_at is null
          else ms.archived_at is null
        end
      )
      and (
        p_event_types is null
        or cardinality(p_event_types) = 0
        or e.event_type = any (p_event_types)
      )
      and (
        p_surfaces is null
        or cardinality(p_surfaces) = 0
        or e.ai_surface = any (p_surfaces)
      )
      and (p_domain_id is null or e.domain_id = p_domain_id)
      and (p_prompt_id is null or mp.id = p_prompt_id)
      and (p_from is null or e.last_seen_at >= p_from)
      and (p_to is null or e.last_seen_at <= p_to)
      and (
        p_has_source is null
        or (p_has_source = true and e.cited_url is not null)
        or (p_has_source = false and e.cited_url is null)
      )
      and (
        p_member_states is null
        or cardinality(p_member_states) = 0
        or (
          ('unread' = any (p_member_states) and ms.seen_at is null)
          or ('seen' = any (p_member_states) and ms.seen_at is not null)
          or ('saved' = any (p_member_states) and ms.saved_at is not null)
          or ('archived' = any (p_member_states) and ms.archived_at is not null)
          or ('resolved' = any (p_member_states) and ms.resolved_at is not null)
          or ('open' = any (p_member_states) and ms.resolved_at is null and ms.archived_at is null)
        )
      )
      and (
        p_search is null
        or length(trim(p_search)) = 0
        or e.search_document @@ plainto_tsquery('english', left(trim(p_search), 120))
        or coalesce(mp.prompt_text, '') ilike '%' || left(trim(p_search), 120) || '%'
        or coalesce(e.cited_hostname, '') ilike '%' || left(trim(p_search), 120) || '%'
        or coalesce(e.source_title, '') ilike '%' || left(trim(p_search), 120) || '%'
        or coalesce(e.source_snippet, '') ilike '%' || left(trim(p_search), 120) || '%'
        or coalesce(e.cited_url, '') ilike '%' || left(trim(p_search), 120) || '%'
      )
      and (
        p_cursor_last_seen_at is null
        or p_cursor_id is null
        or (e.last_seen_at, e.id) < (p_cursor_last_seen_at, p_cursor_id)
      )
  )
  select
    b.id,
    b.workspace_id,
    b.domain_id,
    b.brand_id,
    b.scan_run_id,
    b.ai_response_id,
    b.event_type,
    b.status,
    b.cited_hostname,
    b.cited_url,
    b.cited_url_normalized,
    b.source_title,
    b.source_snippet,
    b.citation_position,
    b.confidence_score,
    b.first_seen_at,
    b.last_seen_at,
    b.monitor_configuration_id,
    b.event_fingerprint,
    b.ai_surface,
    b.occurrence_count,
    b.metadata,
    b.created_at,
    b.updated_at,
    b.member_seen_at,
    b.member_saved_at,
    b.member_archived_at,
    b.member_resolved_at,
    b.prompt_id,
    b.prompt_text,
    b.domain_hostname
  from base b
  order by b.last_seen_at desc, b.id desc
  limit greatest(1, least(coalesce(p_limit, 25), 50));
$$;

revoke all on function public.inbox_list_events(
  uuid, text, text, public.citation_event_type[], public.ai_surface_key[],
  uuid, uuid, timestamptz, timestamptz, text[], boolean, text,
  timestamptz, uuid, integer
) from public;

grant execute on function public.inbox_list_events(
  uuid, text, text, public.citation_event_type[], public.ai_surface_key[],
  uuid, uuid, timestamptz, timestamptz, text[], boolean, text,
  timestamptz, uuid, integer
) to service_role;

-- ---------------------------------------------------------------------------
-- Inbox tab counts RPC
-- ---------------------------------------------------------------------------

create or replace function public.inbox_tab_counts(
  p_workspace_id uuid,
  p_clerk_user_id text
)
returns table (
  all_count bigint,
  new_count bigint,
  citations_count bigint,
  mentions_count bigint,
  recommendations_count bigint,
  opportunities_count bigint,
  saved_count bigint,
  archived_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*) filter (where ms.archived_at is null)::bigint as all_count,
    count(*) filter (where ms.seen_at is null and ms.archived_at is null)::bigint as new_count,
    count(*) filter (where e.event_type = 'citation' and ms.archived_at is null)::bigint as citations_count,
    count(*) filter (where e.event_type = 'mention' and ms.archived_at is null)::bigint as mentions_count,
    count(*) filter (where e.event_type = 'recommendation' and ms.archived_at is null)::bigint as recommendations_count,
    count(*) filter (
      where e.event_type in ('missed_opportunity', 'competitor_citation')
        and ms.archived_at is null
    )::bigint as opportunities_count,
    count(*) filter (where ms.saved_at is not null)::bigint as saved_count,
    count(*) filter (where ms.archived_at is not null)::bigint as archived_count
  from public.citation_events e
  left join public.citation_event_member_states ms
    on ms.citation_event_id = e.id
   and ms.clerk_user_id = p_clerk_user_id
   and ms.workspace_id = p_workspace_id
  where e.workspace_id = p_workspace_id;
$$;

revoke all on function public.inbox_tab_counts(uuid, text) from public;
grant execute on function public.inbox_tab_counts(uuid, text) to service_role;
