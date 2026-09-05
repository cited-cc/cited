-- Optional chatbot lead capture. Primary conversion remains free scan (/scan).
-- No marketing subscription is implied by inserting a row.

create table if not exists public.chatbot_leads (
  id uuid primary key default gen_random_uuid(),
  normalized_domain text not null,
  raw_domain_input text not null,
  email text not null,
  category text not null,
  intent text not null default 'setup',
  source_path text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now()
);

create index if not exists chatbot_leads_created_at_idx
  on public.chatbot_leads (created_at desc);

create index if not exists chatbot_leads_normalized_domain_idx
  on public.chatbot_leads (normalized_domain);

alter table public.chatbot_leads enable row level security;

-- No public policies: only service-role / admin client inserts.
comment on table public.chatbot_leads is
  'Optional Cited AI chatbot lead intents. Not a marketing subscription list.';
