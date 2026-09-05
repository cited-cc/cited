-- Phase 11: durable rate-limit ledger for abuse protection across serverless instances.
-- Privacy-preserving: stores hashed fingerprints only, never raw IPs or emails.

create table if not exists public.rate_limit_buckets (
  bucket_key text primary key,
  window_started_at timestamptz not null,
  hit_count integer not null default 0 check (hit_count >= 0),
  updated_at timestamptz not null default now()
);

create index if not exists rate_limit_buckets_updated_at_idx
  on public.rate_limit_buckets (updated_at);

alter table public.rate_limit_buckets enable row level security;

comment on table public.rate_limit_buckets is
  'Hashed rate-limit counters for sensitive routes. Service-role only. No client policies.';
