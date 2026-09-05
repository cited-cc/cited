-- Persist normalized provider citations and metadata for queryable AI search visibility.

alter table public.ai_responses
  add column if not exists citations_snapshot jsonb not null default '[]'::jsonb,
  add column if not exists provider_metadata jsonb not null default '{}'::jsonb;

comment on column public.ai_responses.citations_snapshot is
  'Normalized citation sources extracted from the provider answer (all sources, not only matched events).';

comment on column public.ai_responses.provider_metadata is
  'Safe provider metadata (tokens, AI overview flags, SERP context) for scan visibility.';
