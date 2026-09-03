-- 0007_audit_fixes.sql
-- Senior inspect pass on migrations 0001-0006 (3 Sep 2026 evening).
-- All changes are additive and idempotent (IF NOT EXISTS / ON CONFLICT / DROP IF EXISTS).
-- No destructive changes to existing rows. Safe to re-run.
--
-- Run order: this is migration 0007 — apply after 0006_device_activations.sql.
-- Forward-only. If you have already applied 0001-0006, this brings them up to spec
-- without re-creating any tables or policies.

-- ---------------------------------------------------------------------------
-- 1) 0001_licenses.sql — add CHECK constraints on status, plan, and email format.
--    Today's table accepts any text in `status` and `plan`, so a webhook typo
--    (e.g. "actiev") silently breaks the license lookup. Email CHECK is a
--    belt-and-braces guard — Supabase Auth already validates email shape on
--    signup, but the Paddle webhook path bypasses Auth and writes email
--    directly from the Paddle payload.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'licenses_status_check'
  ) THEN
    ALTER TABLE public.licenses
      ADD CONSTRAINT licenses_status_check
      CHECK (status IN ('active', 'past_due', 'canceled', 'paused'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'licenses_plan_check'
  ) THEN
    ALTER TABLE public.licenses
      ADD CONSTRAINT licenses_plan_check
      CHECK (plan IN ('appeal_pass', 'guardian_sub'));
  END IF;
END $$;

-- Email CHECK: matches the Supabase Auth regex closely but does not require it
-- to be RFC-perfect (Paddle can deliver "+subaddress" forms, which Supabase
-- accepts but a strict regex would reject). A 2-segment min check is enough
-- to catch obvious garbage while staying permissive for legitimate aliases.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'licenses_email_format_check'
  ) THEN
    ALTER TABLE public.licenses
      ADD CONSTRAINT licenses_email_format_check
      CHECK (email IS NULL OR email ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2) 0005_vault_storage.sql — drop the allowed_mime_types restriction on the
--    vault bucket. Supabase Storage's JS client often sends
--    application/octet-stream for blob uploads unless the developer sets
--    contentType explicitly. The original restriction to ['application/json']
--    would 400 the first vault record save from a paying customer.
--    allowed_mime_types = NULL means "any mime type allowed"; the bucket is
--    still owner-scoped via RLS so this is not a broader security risk.
-- ---------------------------------------------------------------------------

UPDATE storage.buckets
  SET allowed_mime_types = NULL
  WHERE id = 'appealdeck-vault'
    AND allowed_mime_types IS NOT NULL;

-- Belt-and-braces: re-confirm the bucket is private and the size limit is correct.
-- ON CONFLICT keeps the row idempotent if a re-run happens after manual edits.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'appealdeck-vault',
  'appealdeck-vault',
  false,
  10485760,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 3) 0003_license_events.sql — make the select policy actually scope to the
--    caller's own events. The current policy is "any authenticated user can
--    SELECT from license_events if they have ANY license at all" — that is
--    effectively dead code (the only consumer route uses service_role which
--    bypasses RLS entirely), but it is also a future footgun if a real
--    user-facing route ever reads from this table.
--
--    Fix: add license_id FK + scope the policy to (license_id IN user's licenses).
--    Existing rows have license_id = NULL, so the new FK is added as nullable.
-- ---------------------------------------------------------------------------

ALTER TABLE public.license_events
  ADD COLUMN IF NOT EXISTS license_id uuid
    REFERENCES public.licenses(id) ON DELETE CASCADE;

-- Index for the RLS subquery (matches the new policy's lookup).
CREATE INDEX IF NOT EXISTS idx_license_events_license_id
  ON public.license_events (license_id);

DROP POLICY IF EXISTS "license_events_select_own" ON public.license_events;
CREATE POLICY "license_events_select_own" ON public.license_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.licenses l
      WHERE l.id = license_events.license_id
        AND l.email = auth.email()
    )
  );

-- The webhook path uses service_role (bypasses RLS), so it can still write
-- to license_events without a per-user INSERT policy. We do not add one.

-- ---------------------------------------------------------------------------
-- 4) 0002_rls.sql — drop a redundant ALTER TABLE ... ENABLE ROW LEVEL SECURITY
--    on public.licenses. 0001 already enables RLS; 0002's ALTER is a no-op
--    but adds noise. Skipped here to avoid destructive churn — both migrations
--    are already idempotent and the no-op is harmless.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 5) 0001_licenses.sql — index for the device-cap and license lookups that
--    scan by (email, status='active'). The existing licenses_email_idx is
--    a single-column index; the (email, status) composite makes the common
--    "is this user's license active right now?" check single-pass.
--    Safe additive change; CONCURRENTLY not needed at 20-client scale.
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS licenses_email_status_idx
  ON public.licenses (email, status);
