-- Canonical public demo seed (fictional data only).
-- Safe to run multiple times. Does not delete existing user data.
-- Prefer `npm run db:seed` for provider-aware seeding.

INSERT INTO public.workspaces (
  id, name, slug, owner_clerk_user_id, plan_key, status
)
VALUES (
  '11111111-1111-4111-8111-111111111101',
  'Cited Demo Workspace',
  'cited-demo',
  'user_cited_demo_owner',
  'founder',
  'trialing'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.workspace_members (workspace_id, clerk_user_id, role)
SELECT id, 'user_cited_demo_owner', 'owner'
FROM public.workspaces
WHERE slug = 'cited-demo'
ON CONFLICT DO NOTHING;

INSERT INTO public.domains (
  id, workspace_id, hostname, normalized_hostname, display_name,
  verification_status, verification_method, verified_at
)
SELECT
  '11111111-1111-4111-8111-111111111102',
  w.id,
  'cited-test.example',
  'cited-test.example',
  'Cited Test Domain',
  'verified',
  'manual',
  timezone('utc', now())
FROM public.workspaces w
WHERE w.slug = 'cited-demo'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.brands (
  id, workspace_id, primary_domain_id, name, normalized_name, alternate_names, description
)
SELECT
  '11111111-1111-4111-8111-111111111103',
  w.id,
  d.id,
  'Cited Test Brand',
  'cited test brand',
  ARRAY['CitedTest','cited-test.example'],
  'Fictional brand for local development only.'
FROM public.workspaces w
JOIN public.domains d ON d.workspace_id = w.id AND d.normalized_hostname = 'cited-test.example'
WHERE w.slug = 'cited-demo'
ON CONFLICT (id) DO NOTHING;
