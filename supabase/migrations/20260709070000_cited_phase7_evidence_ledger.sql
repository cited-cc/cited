-- Cited Phase 7: Evidence ledger, annotations, notebook revisions
-- Backward-compatible. Does not mutate historical AI responses or evidence text.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.notebook_body_format as enum (
  'plain_text'
);

create type public.notebook_visibility as enum (
  'workspace',
  'private'
);

create type public.citation_annotation_target_kind as enum (
  'event',
  'response',
  'evidence'
);

create type public.citation_annotation_visibility as enum (
  'workspace',
  'private'
);

create type public.citation_annotation_activity_action as enum (
  'created',
  'edited',
  'resolved',
  'reopened',
  'deleted',
  'restored'
);

-- ---------------------------------------------------------------------------
-- notebook_entries expansions
-- ---------------------------------------------------------------------------

alter table public.notebook_entries
  add column if not exists title text,
  add column if not exists body_format public.notebook_body_format not null default 'plain_text',
  add column if not exists visibility public.notebook_visibility not null default 'workspace',
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz;

-- Safe default for existing rows without a title.
update public.notebook_entries
set title = 'Untitled note'
where title is null or btrim(title) = '';

alter table public.notebook_entries
  alter column title set not null,
  alter column title set default 'Untitled note';

create index if not exists notebook_entries_citation_event_id_idx
  on public.notebook_entries (citation_event_id);

create index if not exists notebook_entries_author_clerk_user_id_idx
  on public.notebook_entries (author_clerk_user_id);

create index if not exists notebook_entries_visibility_idx
  on public.notebook_entries (visibility);

create index if not exists notebook_entries_pinned_idx
  on public.notebook_entries (pinned)
  where pinned = true;

create index if not exists notebook_entries_archived_at_idx
  on public.notebook_entries (archived_at);

create index if not exists notebook_entries_deleted_at_idx
  on public.notebook_entries (deleted_at);

create index if not exists notebook_entries_updated_at_idx
  on public.notebook_entries (workspace_id, updated_at desc, id desc);

create index if not exists notebook_entries_workspace_active_idx
  on public.notebook_entries (workspace_id, updated_at desc)
  where deleted_at is null and archived_at is null;

-- Pin semantics: per-note. Workspace notes share pin state with the workspace.
-- Private notes pin state is personal (only the author can see the private note).

-- ---------------------------------------------------------------------------
-- notebook_entry_revisions
-- ---------------------------------------------------------------------------

create table public.notebook_entry_revisions (
  id uuid primary key default gen_random_uuid(),
  notebook_entry_id uuid not null references public.notebook_entries (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  revision_number integer not null check (revision_number >= 1),
  title_snapshot text not null,
  body_snapshot text not null,
  edited_by_clerk_user_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint notebook_entry_revisions_unique_number
    unique (notebook_entry_id, revision_number)
);

create index notebook_entry_revisions_entry_id_idx
  on public.notebook_entry_revisions (notebook_entry_id, revision_number desc);

create index notebook_entry_revisions_workspace_id_idx
  on public.notebook_entry_revisions (workspace_id);

alter table public.notebook_entry_revisions enable row level security;

-- Backfill revision 1 for existing notebook entries.
insert into public.notebook_entry_revisions (
  notebook_entry_id,
  workspace_id,
  revision_number,
  title_snapshot,
  body_snapshot,
  edited_by_clerk_user_id,
  created_at
)
select
  ne.id,
  ne.workspace_id,
  1,
  ne.title,
  ne.body,
  ne.author_clerk_user_id,
  ne.created_at
from public.notebook_entries ne
where not exists (
  select 1
  from public.notebook_entry_revisions r
  where r.notebook_entry_id = ne.id
);

-- ---------------------------------------------------------------------------
-- citation_annotations
-- ---------------------------------------------------------------------------

create table public.citation_annotations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  citation_event_id uuid not null references public.citation_events (id) on delete cascade,
  ai_response_id uuid references public.ai_responses (id) on delete set null,
  citation_evidence_id uuid references public.citation_evidence (id) on delete set null,
  target_kind public.citation_annotation_target_kind not null,
  anchor_start integer check (anchor_start is null or anchor_start >= 0),
  anchor_end integer check (anchor_end is null or anchor_end >= 0),
  anchor_text text,
  context_before text,
  context_after text,
  target_text_hash text,
  body text not null,
  visibility public.citation_annotation_visibility not null default 'workspace',
  author_clerk_user_id text not null,
  resolved_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint citation_annotations_body_length
    check (char_length(body) >= 1 and char_length(body) <= 4000),
  constraint citation_annotations_anchor_text_length
    check (anchor_text is null or char_length(anchor_text) <= 1000),
  constraint citation_annotations_context_before_length
    check (context_before is null or char_length(context_before) <= 200),
  constraint citation_annotations_context_after_length
    check (context_after is null or char_length(context_after) <= 200),
  constraint citation_annotations_anchor_range
    check (
      (anchor_start is null and anchor_end is null)
      or (
        anchor_start is not null
        and anchor_end is not null
        and anchor_end > anchor_start
      )
    ),
  constraint citation_annotations_target_shape check (
    (
      target_kind = 'event'
      and ai_response_id is null
      and citation_evidence_id is null
      and anchor_start is null
      and anchor_end is null
      and anchor_text is null
    )
    or (
      target_kind = 'response'
      and ai_response_id is not null
      and citation_evidence_id is null
    )
    or (
      target_kind = 'evidence'
      and citation_evidence_id is not null
    )
  )
);

create index citation_annotations_workspace_id_idx
  on public.citation_annotations (workspace_id);

create index citation_annotations_citation_event_id_idx
  on public.citation_annotations (citation_event_id);

create index citation_annotations_ai_response_id_idx
  on public.citation_annotations (ai_response_id);

create index citation_annotations_citation_evidence_id_idx
  on public.citation_annotations (citation_evidence_id);

create index citation_annotations_author_clerk_user_id_idx
  on public.citation_annotations (author_clerk_user_id);

create index citation_annotations_visibility_idx
  on public.citation_annotations (visibility);

create index citation_annotations_deleted_at_idx
  on public.citation_annotations (deleted_at);

create index citation_annotations_created_at_idx
  on public.citation_annotations (citation_event_id, created_at desc)
  where deleted_at is null;

create trigger citation_annotations_set_updated_at
  before update on public.citation_annotations
  for each row execute function public.set_updated_at();

alter table public.citation_annotations enable row level security;

-- Ensure annotation workspace matches parent citation event.
create or replace function public.enforce_citation_annotation_workspace()
returns trigger
language plpgsql
as $$
declare
  event_workspace uuid;
begin
  select workspace_id into event_workspace
  from public.citation_events
  where id = new.citation_event_id;

  if event_workspace is null then
    raise exception 'citation_annotations: citation event not found';
  end if;

  if new.workspace_id is distinct from event_workspace then
    raise exception 'citation_annotations: workspace_id must match citation event';
  end if;

  return new;
end;
$$;

create trigger citation_annotations_enforce_workspace
  before insert or update on public.citation_annotations
  for each row execute function public.enforce_citation_annotation_workspace();

-- ---------------------------------------------------------------------------
-- citation_annotation_activity
-- ---------------------------------------------------------------------------

create table public.citation_annotation_activity (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  citation_annotation_id uuid not null references public.citation_annotations (id) on delete cascade,
  clerk_user_id text not null,
  action public.citation_annotation_activity_action not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index citation_annotation_activity_workspace_id_idx
  on public.citation_annotation_activity (workspace_id);

create index citation_annotation_activity_annotation_id_idx
  on public.citation_annotation_activity (citation_annotation_id, created_at desc);

alter table public.citation_annotation_activity enable row level security;

-- ---------------------------------------------------------------------------
-- citation_event_occurrences material-change metadata
-- ---------------------------------------------------------------------------

alter table public.citation_event_occurrences
  add column if not exists source_fingerprint text,
  add column if not exists response_fingerprint text,
  add column if not exists is_material_change boolean,
  add column if not exists change_summary text;

-- Backfill fingerprints from existing stored fields (deterministic, no LLM).
update public.citation_event_occurrences
set
  source_fingerprint = coalesce(
    source_fingerprint,
    md5(
      coalesce(source_url_normalized, '') || '|' ||
      coalesce(source_hostname, '') || '|' ||
      coalesce(citation_position::text, '')
    )
  ),
  response_fingerprint = coalesce(response_fingerprint, evidence_hash)
where source_fingerprint is null or response_fingerprint is null;

comment on column public.citation_event_occurrences.change_summary is
  'Deterministic factual label only. Never causal or quality language.';

comment on column public.notebook_entries.pinned is
  'Per-note pin. Shared for workspace notes; private notes are author-only so pin is personal.';
