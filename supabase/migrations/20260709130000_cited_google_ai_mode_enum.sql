-- Add Google AI Mode to the AI surface enum.
-- Must commit before the value can be used in DML (separate migration).

alter type public.ai_surface_key add value if not exists 'google_ai_mode';
