-- 0016_revoke_anon_licence_reads.sql
-- licenses and license_events answered anonymous requests with an empty list (row-level security
-- filtered every row) while every other table refused at grant level. Safe today; one wrong policy
-- added later would have exposed them. Signed-in sellers keep reading their own rows through the
-- existing policies; the server uses the service role and is unaffected.
begin;
revoke all on public.licenses from anon;
revoke all on public.license_events from anon;
commit;
