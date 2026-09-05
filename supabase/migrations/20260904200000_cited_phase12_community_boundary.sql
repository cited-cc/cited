-- Phase 12: mark legacy Cloud-only tables as deprecated for fresh installs.
-- Existing databases retain tables for safe upgrade paths. Manual archival may remove them later.

DO $$
BEGIN
  IF to_regclass('public.checkout_intents') IS NOT NULL THEN
    COMMENT ON TABLE public.checkout_intents IS
      'Deprecated: hosted Stripe checkout. Retained for upgrade compatibility only.';
  END IF;

  IF to_regclass('public.billing_events') IS NOT NULL THEN
    COMMENT ON TABLE public.billing_events IS
      'Deprecated: hosted Stripe billing events. Retained for upgrade compatibility only.';
  END IF;

  IF to_regclass('public.free_scan_leads') IS NOT NULL THEN
    COMMENT ON TABLE public.free_scan_leads IS
      'Deprecated: hosted marketing free-scan funnel. Retained for upgrade compatibility only.';
  END IF;

  IF to_regclass('public.chatbot_leads') IS NOT NULL THEN
    COMMENT ON TABLE public.chatbot_leads IS
      'Deprecated: hosted marketing chatbot leads. Retained for upgrade compatibility only.';
  END IF;

  IF to_regclass('public.lifecycle_email_sends') IS NOT NULL THEN
    COMMENT ON TABLE public.lifecycle_email_sends IS
      'Deprecated: hosted lifecycle email campaigns. Retained for upgrade compatibility only.';
  END IF;

  IF to_regclass('public.resend_webhook_events') IS NOT NULL THEN
    COMMENT ON TABLE public.resend_webhook_events IS
      'Deprecated: hosted Resend inbound webhook log. Retained for upgrade compatibility only.';
  END IF;
END $$;
