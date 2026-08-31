-- 0001_licenses.sql
-- Appeal Pass self-issued license keys (M-3).
-- Applied to the fresh Supabase project (ref dtddptwudzovcchaciwt, eu-west-1).
-- RLS enabled: only the service_role key (server-side admin client) may read/write.

CREATE TABLE IF NOT EXISTS public.licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key text UNIQUE NOT NULL,
  email text,
  plan text NOT NULL DEFAULT 'appeal_pass',
  status text NOT NULL DEFAULT 'active',
  provider text,
  provider_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  expires_at timestamptz
);

CREATE INDEX IF NOT EXISTS licenses_license_key_idx ON public.licenses (license_key);
CREATE INDEX IF NOT EXISTS licenses_email_idx ON public.licenses (email);

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
