-- 0025_case_rounds.sql
-- How far a case has got, remembered on the server (26 Oct 2026).
--
-- WHY: One Response covers the first response of one case, and the Appeal Pass covers every round.
-- Until now the only record of which round a response belonged to was the case workspace, which
-- lives in the seller's browser: `responseRound(workspace)` and a client-sent attempt number. A
-- seller who cleared the browser, or edited the case back to an earlier state, presented round one
-- again and a used One Response prepared another response.
--
-- WHAT IS KEPT: one integer per (account, case): the highest response round the server has seen
-- when a response was prepared. Never the notice, the response, a file, or a name. It is derived
-- from what the seller already sent us at prepare time and is deleted with the account (the foreign
-- key below is ON DELETE CASCADE).
--
-- WHAT IT DOES NOT FIX, stated so nobody later mistakes this for a guarantee: the round is only
-- known from what the client reports when it prepares a response. A seller who reaches round two
-- without ever preparing it here (Amazon replied, and they reset the case before preparing) is
-- still sold and served round one. Detecting that needs Amazon to tell us, which nothing in this
-- product does. The UI's own advice (`src/lib/planAdvice.ts`) tells the seller before paying.
--
-- HOW IT IS USED: `record_case_round` is called by /api/compose after the licence check; it returns
-- the stored high-water mark after taking the larger of the two, so a refused round two is still
-- remembered. /api/checkout/intent reads the mark before selling a One Response, so a case that is
-- already past its first response is not sold one. The function never lowers the stored value.
--
-- RLS is on with no policy for anon or authenticated: only the service role (server) reads or
-- writes, as with the entitlement tables. Applying this file before the app is deployed is safe:
-- nothing calls it until the app does.

begin;

create table if not exists public.case_rounds (
  user_id uuid not null references auth.users(id) on delete cascade,
  -- The case identifier the browser generated, the same one the checkout intent and licences use.
  case_id text not null check (case_id ~ '^[A-Za-z0-9_-]{1,100}$'),
  highest_round integer not null default 1 check (highest_round between 1 and 99),
  first_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, case_id)
);

alter table public.case_rounds enable row level security;
revoke all on public.case_rounds from anon, authenticated;

create or replace function public.record_case_round(
  p_user_id uuid, p_case_id text, p_round integer
) returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare
  stored integer;
begin
  if p_user_id is null or p_case_id is null or p_case_id !~ '^[A-Za-z0-9_-]{1,100}$' then
    raise exception 'Missing or invalid case identity';
  end if;
  if p_round is null or p_round < 1 or p_round > 99 then
    raise exception 'Invalid response round';
  end if;
  insert into case_rounds(user_id, case_id, highest_round)
  values (p_user_id, p_case_id, p_round)
  on conflict (user_id, case_id) do update
    set highest_round = greatest(case_rounds.highest_round, excluded.highest_round),
        updated_at = now()
  returning highest_round into stored;
  return stored;
end $$;

revoke all on function public.record_case_round(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.record_case_round(uuid, text, integer) to service_role;

commit;
