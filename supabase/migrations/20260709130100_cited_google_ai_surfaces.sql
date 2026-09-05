-- Seed Google AI Mode and promote DataForSEO-backed surfaces to beta.

insert into public.ai_surfaces (
  key,
  display_name,
  category,
  supports_citations,
  supports_mentions,
  supports_location,
  supports_scheduled_monitoring,
  status
)
values (
  'google_ai_mode',
  'Google AI Mode',
  'search',
  true,
  true,
  true,
  true,
  'beta'
)
on conflict (key) do update
set
  display_name = excluded.display_name,
  category = excluded.category,
  supports_citations = excluded.supports_citations,
  supports_mentions = excluded.supports_mentions,
  supports_location = excluded.supports_location,
  supports_scheduled_monitoring = excluded.supports_scheduled_monitoring,
  status = excluded.status,
  updated_at = timezone('utc', now());

update public.ai_surfaces
set
  status = 'beta',
  supports_location = true,
  supports_scheduled_monitoring = true,
  updated_at = timezone('utc', now())
where key in ('perplexity', 'claude', 'google_ai_overviews');
