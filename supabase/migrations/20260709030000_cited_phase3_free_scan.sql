-- Phase 3: Free citation scan intake
-- Private result access uses public_token (not sequential ids).
-- No raw IP storage. Fingerprint is a one-way hash for rate limiting / dedupe.

create type public.free_scan_status as enum (
  'requested',
  'verified',
  'queued',
  'scanning',
  'completed',
  'failed',
  'expired'
);

create table public.free_scan_requests (
  id uuid primary key default gen_random_uuid(),
  public_token text not null,
  status public.free_scan_status not null default 'requested',
  normalized_hostname text not null,
  raw_domain_input text not null,
  brand_name text not null,
  alternate_brand_names text[] not null default '{}',
  prompts text[] not null default '{}',
  email text not null,
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  terms_accepted_at timestamptz not null,
  source text not null default 'marketing_scan',
  referrer_path text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  request_fingerprint_hash text,
  requested_at timestamptz not null default now(),
  queued_at timestamptz,
  completed_at timestamptz,
  expired_at timestamptz,
  result_summary jsonb,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint free_scan_requests_public_token_key unique (public_token),
  constraint free_scan_requests_public_token_len check (
    char_length(public_token) >= 16 and char_length(public_token) <= 128
  ),
  constraint free_scan_requests_hostname_len check (
    char_length(normalized_hostname) >= 3 and char_length(normalized_hostname) <= 253
  ),
  constraint free_scan_requests_email_len check (
    char_length(email) >= 3 and char_length(email) <= 254
  ),
  constraint free_scan_requests_prompts_len check (
    cardinality(prompts) >= 1 and cardinality(prompts) <= 3
  )
);

create index free_scan_requests_status_idx
  on public.free_scan_requests (status);

create index free_scan_requests_requested_at_idx
  on public.free_scan_requests (requested_at desc);

create index free_scan_requests_fingerprint_idx
  on public.free_scan_requests (request_fingerprint_hash, requested_at desc)
  where request_fingerprint_hash is not null;

create trigger free_scan_requests_set_updated_at
  before update on public.free_scan_requests
  for each row
  execute function public.set_updated_at();

alter table public.free_scan_requests enable row level security;

-- Deny-by-default RLS. Writes go through the service-role admin client only.
comment on table public.free_scan_requests is
  'Public free-scan / early-access intake. Access results via public_token only.';
