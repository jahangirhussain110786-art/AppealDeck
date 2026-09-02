-- 0003_license_events.sql
-- Idempotency log for Paddle webhook events. Ensures we never apply the same
-- event twice even if Paddle retries with the same body/signature.

CREATE TABLE IF NOT EXISTS public.license_events (
  id bigserial PRIMARY KEY,
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_event_id)
);

ALTER TABLE public.license_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "license_events_select_own" ON public.license_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.licenses l
      WHERE l.email = auth.email()
    )
  );

CREATE INDEX IF NOT EXISTS idx_license_events_provider_event_id
  ON public.license_events (provider, provider_event_id);
