-- Add Portfolio to the public plan enum.
-- Must commit before the value can be used in DML (separate migration).

alter type public.plan_key add value if not exists 'portfolio' after 'pro';
