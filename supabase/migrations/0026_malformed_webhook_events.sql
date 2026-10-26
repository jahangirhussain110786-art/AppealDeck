-- 0026_malformed_webhook_events.sql — 26 Oct 2026
--
-- A Paddle webhook that passes HMAC verification but fails the event schema was dropped with a
-- bare 400 and no record. If Paddle renames or moves a field, provisioning stops for every buyer
-- and nothing says so. The route now parks the *shape* of the event here (never the body: it
-- carries the buyer's email address) and the daily ops digest counts the rows.
--
-- Rows are diagnostic, not payments: prune them once the cause is fixed, e.g.
--   delete from public.malformed_webhook_events where received_at < now() - interval '30 days';

begin;

create table if not exists public.malformed_webhook_events (
  id bigserial primary key,
  received_at timestamptz not null default now(),
  event_type text,
  event_id text,
  -- Which field failed and why, from the schema itself (truncated).
  issue text not null,
  body_bytes integer not null
);

create index if not exists malformed_webhook_events_received_at_idx
  on public.malformed_webhook_events (received_at desc);

alter table public.malformed_webhook_events enable row level security;
revoke all on public.malformed_webhook_events from anon, authenticated;

commit;
