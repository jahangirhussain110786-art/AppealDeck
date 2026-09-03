-- 0006_device_activations.sql
-- AM-11 / Gate-2 §31: server-side device activation cap per license.
-- 5 devices per license key (the plan's "3-5" upper bound — start at the looser limit,
-- tighten only on observed abuse per TRC-12). Self-service deactivation via DELETE.
-- Fingerprint is a server-derived hash; raw client headers never persist.
-- Applied forward-only; idempotent via IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS public.license_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  device_fingerprint text NOT NULL,
  label text,
  user_agent text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE (license_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS license_devices_license_id_idx
  ON public.license_devices (license_id);

CREATE INDEX IF NOT EXISTS license_devices_user_id_idx
  ON public.license_devices (user_id);

-- service_role bypasses RLS by design, so the webhook and server-side checks continue to work.
-- Authenticated users can read + revoke ONLY their own devices (matched via licenses.email).
ALTER TABLE public.license_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "license_devices_select_own" ON public.license_devices;
CREATE POLICY "license_devices_select_own" ON public.license_devices
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.licenses l
      WHERE l.id = license_devices.license_id
        AND l.email = auth.email()
    )
  );

DROP POLICY IF EXISTS "license_devices_delete_own" ON public.license_devices;
CREATE POLICY "license_devices_delete_own" ON public.license_devices
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.licenses l
      WHERE l.id = license_devices.license_id
        AND l.email = auth.email()
    )
  );

-- No INSERT/UPDATE policy for authenticated: the server-side admin client owns writes
-- (touch() on every /api/* call that needs the license, recordActivation on first use).
