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

-- Fictional monitored prompts (deterministic UUIDs)
INSERT INTO public.monitored_prompts (
  id, workspace_id, domain_id, name, prompt_text, normalized_prompt,
  locale, language_code, country_code, active, monitoring_frequency, priority
)
SELECT
  '11111111-1111-4111-8111-111111111201',
  w.id,
  d.id,
  'AI citation tools',
  'What is the best tool to monitor AI citations?',
  'what is the best tool to monitor ai citations?',
  'en-US', 'en', 'US', true, 'twice_weekly', 'normal'
FROM public.workspaces w
JOIN public.domains d ON d.workspace_id = w.id AND d.normalized_hostname = 'cited-test.example'
WHERE w.slug = 'cited-demo'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.monitored_prompts (
  id, workspace_id, domain_id, name, prompt_text, normalized_prompt,
  locale, language_code, country_code, active, monitoring_frequency, priority
)
SELECT
  '11111111-1111-4111-8111-111111111202',
  w.id,
  d.id,
  'AI SEO',
  'Best AI SEO tools for startups',
  'best ai seo tools for startups',
  'en-US', 'en', 'US', true, 'twice_weekly', 'normal'
FROM public.workspaces w
JOIN public.domains d ON d.workspace_id = w.id AND d.normalized_hostname = 'cited-test.example'
WHERE w.slug = 'cited-demo'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.monitored_prompts (
  id, workspace_id, domain_id, name, prompt_text, normalized_prompt,
  locale, language_code, country_code, active, monitoring_frequency, priority
)
SELECT
  '11111111-1111-4111-8111-111111111203',
  w.id,
  d.id,
  'Crypto intelligence',
  'Best crypto market intelligence tools',
  'best crypto market intelligence tools',
  'en-US', 'en', 'US', true, 'weekly', 'normal'
FROM public.workspaces w
JOIN public.domains d ON d.workspace_id = w.id AND d.normalized_hostname = 'cited-test.example'
WHERE w.slug = 'cited-demo'
ON CONFLICT (id) DO NOTHING;

-- Monitor configuration (ChatGPT surface)
INSERT INTO public.monitor_configurations (
  id, workspace_id, monitored_prompt_id, ai_surface, enabled,
  scan_frequency, locale, country_code
)
SELECT
  '11111111-1111-4111-8111-111111111301',
  w.id,
  '11111111-1111-4111-8111-111111111201',
  'chatgpt', true, 'twice_weekly', 'en-US', 'US'
FROM public.workspaces w
WHERE w.slug = 'cited-demo'
ON CONFLICT (id) DO NOTHING;

-- Fictional competitor domain
INSERT INTO public.competitor_hostnames (
  id, workspace_id, hostname, normalized_hostname, display_name, active
)
SELECT
  '11111111-1111-4111-8111-111111111401',
  w.id,
  'competitor-labs.example',
  'competitor-labs.example',
  'Competitor Labs (fictional)',
  true
FROM public.workspaces w
WHERE w.slug = 'cited-demo'
ON CONFLICT (id) DO NOTHING;

-- Completed mock scan run and evidence chain
INSERT INTO public.scan_runs (
  id, workspace_id, monitor_configuration_id, status, requested_at,
  started_at, completed_at, provider, provider_task_id, provider_cost_usd,
  response_hash, metadata
)
SELECT
  '11111111-1111-4111-8111-111111111501',
  w.id,
  '11111111-1111-4111-8111-111111111301',
  'completed',
  timezone('utc', now()) - interval '2 hours',
  timezone('utc', now()) - interval '2 hours',
  timezone('utc', now()) - interval '1 hour',
  'mock',
  'seed_mock_scan_001',
  0,
  'a1b2c3d4e5f6mockseedhash0000000000000000000000000000000001',
  '{"mock":true,"seed":true}'::jsonb
FROM public.workspaces w
WHERE w.slug = 'cited-demo'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ai_responses (
  id, workspace_id, scan_run_id, ai_surface, prompt_text_snapshot,
  response_text, response_language, response_hash, model_name,
  location_snapshot, raw_provider_payload
)
SELECT
  '11111111-1111-4111-8111-111111111601',
  w.id,
  '11111111-1111-4111-8111-111111111501',
  'chatgpt',
  'What is the best tool to monitor AI citations?',
  '[MOCK DATA] Cited Test Brand offers citation monitoring. See https://cited-test.example/guides/ai-citations. Competitor Labs is also mentioned at https://competitor-labs.example/product.',
  'en',
  'a1b2c3d4e5f6mockseedhash0000000000000000000000000000000001',
  'mock-model-v1',
  '{"country_code":"US","locale":"en-US"}'::jsonb,
  '{"mock":true,"seed":true}'::jsonb
FROM public.workspaces w
WHERE w.slug = 'cited-demo'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.citation_events (
  id, workspace_id, domain_id, brand_id, scan_run_id, ai_response_id,
  event_type, status, cited_hostname, cited_url, cited_url_normalized,
  source_title, source_snippet, citation_position, confidence_score,
  first_seen_at, last_seen_at
)
SELECT * FROM (VALUES
  (
    '11111111-1111-4111-8111-111111111701'::uuid,
    (SELECT id FROM public.workspaces WHERE slug = 'cited-demo'),
    '11111111-1111-4111-8111-111111111102'::uuid,
    '11111111-1111-4111-8111-111111111103'::uuid,
    '11111111-1111-4111-8111-111111111501'::uuid,
    '11111111-1111-4111-8111-111111111601'::uuid,
    'citation'::public.citation_event_type,
    'new'::public.citation_event_status,
    'cited-test.example',
    'https://cited-test.example/guides/ai-citations',
    'https://cited-test.example/guides/ai-citations',
    '[MOCK] AI citation guide',
    '[MOCK] Cited Test Brand monitoring guide.',
    1, 0.94,
    timezone('utc', now()) - interval '1 hour',
    timezone('utc', now()) - interval '1 hour'
  ),
  (
    '11111111-1111-4111-8111-111111111702'::uuid,
    (SELECT id FROM public.workspaces WHERE slug = 'cited-demo'),
    '11111111-1111-4111-8111-111111111102'::uuid,
    '11111111-1111-4111-8111-111111111103'::uuid,
    '11111111-1111-4111-8111-111111111501'::uuid,
    '11111111-1111-4111-8111-111111111601'::uuid,
    'mention'::public.citation_event_type,
    'new'::public.citation_event_status,
    NULL, NULL, NULL, NULL,
    '[MOCK] Brand name mentioned without source URL.',
    NULL, 0.72,
    timezone('utc', now()) - interval '1 hour',
    timezone('utc', now()) - interval '1 hour'
  ),
  (
    '11111111-1111-4111-8111-111111111703'::uuid,
    (SELECT id FROM public.workspaces WHERE slug = 'cited-demo'),
    '11111111-1111-4111-8111-111111111102'::uuid,
    NULL,
    '11111111-1111-4111-8111-111111111501'::uuid,
    '11111111-1111-4111-8111-111111111601'::uuid,
    'competitor_citation'::public.citation_event_type,
    'new'::public.citation_event_status,
    'competitor-labs.example',
    'https://competitor-labs.example/product',
    'https://competitor-labs.example/product',
    '[MOCK] Competitor Labs',
    '[MOCK] Competitor cited on monitored prompt.',
    1, 0.81,
    timezone('utc', now()) - interval '1 hour',
    timezone('utc', now()) - interval '1 hour'
  ),
  (
    '11111111-1111-4111-8111-111111111704'::uuid,
    (SELECT id FROM public.workspaces WHERE slug = 'cited-demo'),
    '11111111-1111-4111-8111-111111111102'::uuid,
    NULL,
    '11111111-1111-4111-8111-111111111501'::uuid,
    '11111111-1111-4111-8111-111111111601'::uuid,
    'missed_opportunity'::public.citation_event_type,
    'new'::public.citation_event_status,
    'competitor-labs.example',
    'https://competitor-labs.example/product',
    'https://competitor-labs.example/product',
    '[MOCK] Missed opportunity',
    '[MOCK] Competitor cited while verified domain was absent.',
    1, 0.79,
    timezone('utc', now()) - interval '1 hour',
    timezone('utc', now()) - interval '1 hour'
  )
) AS seed_events(
  id, workspace_id, domain_id, brand_id, scan_run_id, ai_response_id,
  event_type, status, cited_hostname, cited_url, cited_url_normalized,
  source_title, source_snippet, citation_position, confidence_score,
  first_seen_at, last_seen_at
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.citation_evidence (
  citation_event_id, evidence_type, evidence_text, evidence_url,
  evidence_position, metadata
)
VALUES (
  '11111111-1111-4111-8111-111111111701',
  'source_link',
  '[MOCK] Source link matched verified domain.',
  'https://cited-test.example/guides/ai-citations',
  1,
  '{"seed":true}'::jsonb
)
ON CONFLICT DO NOTHING;

INSERT INTO public.notebook_entries (
  id, workspace_id, citation_event_id, author_clerk_user_id,
  title, body, body_format, visibility, pinned
)
SELECT
  '11111111-1111-4111-8111-111111111801',
  w.id,
  '11111111-1111-4111-8111-111111111701',
  'user_cited_demo_owner',
  '[MOCK SEED] First citation note',
  '[MOCK SEED] Fictional notebook entry: verified domain appeared in a monitored ChatGPT response.',
  'plain_text',
  'workspace',
  true
FROM public.workspaces w
WHERE w.slug = 'cited-demo'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.notification_preferences (
  workspace_id, email_enabled, weekly_digest_enabled,
  instant_citation_alerts_enabled, competitor_alerts_enabled,
  missed_opportunity_alerts_enabled, slack_enabled
)
SELECT
  w.id, true, true, true, true, true, false
FROM public.workspaces w
WHERE w.slug = 'cited-demo'
ON CONFLICT (workspace_id) DO NOTHING;
