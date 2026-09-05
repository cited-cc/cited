-- Cited Phase 5: canonical internal identities and local credentials.
-- Forward-only migration. Preserves Clerk membership columns during transition.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email_normalized text,
  display_name text,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists users_email_normalized_unique_idx
  on public.users (lower(email_normalized))
  where email_normalized is not null;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create table if not exists public.auth_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null check (provider in ('clerk', 'local')),
  provider_subject text not null,
  provider_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint auth_identities_provider_subject_unique unique (provider, provider_subject)
);

create index if not exists auth_identities_user_id_idx
  on public.auth_identities (user_id);

create trigger auth_identities_set_updated_at
  before update on public.auth_identities
  for each row execute function public.set_updated_at();

comment on column public.auth_identities.provider_metadata is
  'Provider-safe metadata only. Never store passwords, session tokens, or raw invitation tokens.';

create table if not exists public.local_credentials (
  user_id uuid primary key references public.users (id) on delete cascade,
  password_hash text not null,
  password_changed_at timestamptz,
  failed_attempt_count integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on column public.local_credentials.password_hash is
  'Versioned scrypt hash. Never store plaintext passwords.';

create trigger local_credentials_set_updated_at
  before update on public.local_credentials
  for each row execute function public.set_updated_at();

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email_normalized text not null,
  role public.workspace_role not null default 'member',
  token_hash text not null,
  invited_by_user_id uuid references public.users (id) on delete set null,
  accepted_by_user_id uuid references public.users (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists workspace_invitations_token_hash_unique_idx
  on public.workspace_invitations (token_hash);

create index if not exists workspace_invitations_workspace_id_idx
  on public.workspace_invitations (workspace_id, status);

comment on column public.workspace_invitations.token_hash is
  'SHA-256 hash of the one-time invitation token. Never store raw tokens.';

create trigger workspace_invitations_set_updated_at
  before update on public.workspace_invitations
  for each row execute function public.set_updated_at();

create table if not exists public.auth_audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  workspace_id uuid references public.workspaces (id) on delete set null,
  action text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists auth_audit_events_user_id_idx
  on public.auth_audit_events (user_id, created_at desc);

alter table public.workspaces
  add column if not exists owner_user_id uuid references public.users (id) on delete set null;

alter table public.workspace_members
  add column if not exists user_id uuid references public.users (id) on delete set null;

create index if not exists workspace_members_user_id_idx
  on public.workspace_members (user_id);

create index if not exists workspaces_owner_user_id_idx
  on public.workspaces (owner_user_id);

-- Backfill internal users and identities from distinct Clerk subjects.
insert into public.users (id, email_normalized, display_name, status)
select
  gen_random_uuid(),
  null,
  null,
  'active'
from (
  select distinct clerk_user_id
  from public.workspace_members
  where clerk_user_id is not null
    and clerk_user_id not like 'local:%'
) subjects
where not exists (
  select 1
  from public.auth_identities ai
  where ai.provider = 'clerk'
    and ai.provider_subject = subjects.clerk_user_id
);

insert into public.auth_identities (user_id, provider, provider_subject)
select u.id, 'clerk', subjects.clerk_user_id
from (
  select distinct wm.clerk_user_id
  from public.workspace_members wm
  where wm.clerk_user_id is not null
    and wm.clerk_user_id not like 'local:%'
) subjects
join lateral (
  select id
  from public.users u
  where not exists (
    select 1
    from public.auth_identities ai
    where ai.provider = 'clerk'
      and ai.provider_subject = subjects.clerk_user_id
  )
  order by u.created_at asc
  limit 1
) u on true
on conflict (provider, provider_subject) do nothing;

-- Link identities to users for any rows created above without a join match.
insert into public.auth_identities (user_id, provider, provider_subject)
select u.id, 'clerk', s.clerk_user_id
from (
  select distinct clerk_user_id
  from public.workspace_members
  where clerk_user_id is not null
    and clerk_user_id not like 'local:%'
) s
join public.users u on true
where not exists (
  select 1 from public.auth_identities ai
  where ai.provider = 'clerk' and ai.provider_subject = s.clerk_user_id
)
on conflict do nothing;

update public.workspace_members wm
set user_id = ai.user_id
from public.auth_identities ai
where wm.user_id is null
  and ai.provider = 'clerk'
  and ai.provider_subject = wm.clerk_user_id;

update public.workspaces w
set owner_user_id = ai.user_id
from public.auth_identities ai
where w.owner_user_id is null
  and ai.provider = 'clerk'
  and ai.provider_subject = w.owner_clerk_user_id;

alter table public.users enable row level security;
alter table public.auth_identities enable row level security;
alter table public.local_credentials enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.auth_audit_events enable row level security;

-- Service-role architecture: no permissive anonymous policies on credential tables.
