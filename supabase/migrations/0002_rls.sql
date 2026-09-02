-- 0002_rls_policies.sql
-- Row Level Security policies for public.licenses (M-3).
-- service_role (server-side admin client) bypasses RLS by design, so the webhook
-- and server-rendered dashboard reads continue to work. These policies let an
-- authenticated user read/update ONLY their own row (matched by email == auth.email()).

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "licenses_select_own" ON public.licenses;
CREATE POLICY "licenses_select_own" ON public.licenses
  FOR SELECT
  TO authenticated
  USING (email = auth.email());

DROP POLICY IF EXISTS "licenses_update_own" ON public.licenses;
CREATE POLICY "licenses_update_own" ON public.licenses
  FOR UPDATE
  TO authenticated
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

-- No INSERT policy for anon/authenticated: licenses are created only by the
-- server-side webhook using the service_role key (which bypasses RLS).
