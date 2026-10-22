-- 0019_outcome_reports.sql
-- The $25 outcome-report rebate (22 Oct 2026, stage 3 of docs/handoffs/2026-10-22-combined-growth-plan.md).
--
-- A seller who paid for a Pass may tell us how the case ended, whatever the result, and is refunded
-- $25 of that payment. The report is tied to the account so we know whom to refund. It is NOT the
-- anonymous outcome share (outcome_events, migration 0008), which carries no identity and stays
-- exactly as it is: this is a separate, plainly labelled opt-in, and the privacy policy says so.
--
-- The refund itself is made by hand in Paddle (a partial refund of the transaction, reason
-- "Outcome report rebate"); a partial refund does not take the Pass away (the payment function only
-- cancels on a full refund or a chargeback). Then mark the report settled:
--   update outcome_reports set rebate_status = 'refunded', settled_at = now() where transaction_id = 'txn_...';
--
-- Inert until NEXT_PUBLIC_REBATE_ENABLED=true is set: the app shows no offer and the route answers
-- "not offered" without it. Apply after 0018. One transaction.

begin;

create table if not exists public.outcome_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- The payment the rebate refers to; one report and one rebate per payment.
  transaction_id text not null unique,
  result text not null check (result in ('approved', 'rejected', 'no_response', 'withdrawn')),
  days_to_outcome integer check (days_to_outcome is null or (days_to_outcome >= 0 and days_to_outcome <= 3650)),
  rebate_status text not null default 'pending' check (rebate_status in ('pending', 'refunded', 'declined')),
  rebate_cents integer not null default 2500 check (rebate_cents >= 0),
  created_at timestamptz not null default now(),
  settled_at timestamptz
);
create index if not exists outcome_reports_pending on public.outcome_reports (created_at) where rebate_status = 'pending';

-- Service role only, like every other table that holds a buyer's data.
alter table public.outcome_reports enable row level security;
revoke all on public.outcome_reports from anon, authenticated;

commit;
