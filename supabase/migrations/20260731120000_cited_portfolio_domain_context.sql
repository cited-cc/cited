-- Portfolio domain context: per-member active domain + extra domain add-on billing.

alter table public.workspace_members
  add column if not exists active_domain_id uuid references public.domains (id) on delete set null;

create index if not exists workspace_members_active_domain_id_idx
  on public.workspace_members (active_domain_id);

alter table public.workspaces
  add column if not exists portfolio_extra_domains integer not null default 0;

alter table public.workspaces
  drop constraint if exists workspaces_portfolio_extra_domains_check;

alter table public.workspaces
  add constraint workspaces_portfolio_extra_domains_check
  check (portfolio_extra_domains >= 0);

alter table public.workspaces
  add column if not exists stripe_portfolio_extra_domain_item_id text;

comment on column public.workspace_members.active_domain_id is
  'Per-member active domain within a multi-domain workspace.';

comment on column public.workspaces.portfolio_extra_domains is
  'Purchased Portfolio add-on domain slots beyond the 5 included in the plan.';

comment on column public.workspaces.stripe_portfolio_extra_domain_item_id is
  'Stripe subscription item ID for the Portfolio extra domain add-on line item.';
