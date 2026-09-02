-- 0004_license_lifecycle.sql
-- Adds lifecycle timestamp columns to public.licenses that the Paddle webhook
-- writes to (canceled_at, paused_at) plus a subscription_id index used by the
-- upsert path. Forward-only; idempotent via ADD COLUMN IF NOT EXISTS.

ALTER TABLE public.licenses
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz,
  ADD COLUMN IF NOT EXISTS paused_at   timestamptz;

CREATE INDEX IF NOT EXISTS licenses_provider_subscription_id_idx
  ON public.licenses (provider_subscription_id);
