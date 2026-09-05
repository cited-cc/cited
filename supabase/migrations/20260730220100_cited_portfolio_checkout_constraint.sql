-- Allow Portfolio in checkout intent plan validation.

alter table public.checkout_intents
  drop constraint if exists checkout_intents_paid_plan_check;

alter table public.checkout_intents
  add constraint checkout_intents_paid_plan_check
  check (
    requested_plan_key in ('founder', 'growth', 'pro', 'portfolio')
  );
