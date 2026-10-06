-- 0012_payment_integrity_hardening.sql
-- Fixes found in the 6 Oct 2026 review of 0009. Apply in the Supabase SQL editor after 0011.
-- Never edit 0009; this migration replaces the function and adjusts the tables it created.
--
-- 1. A completed payment that cannot be matched to a checkout (wrong/missing price id, missing or
--    invalid custom_data, an intent bound to a different transaction, an intent whose account was
--    deleted) used to be either silently dropped but recorded as processed, or raised so Paddle
--    retried for days. It is now PARKED in payment_events_unmatched and NOT recorded in
--    payment_events, so a replay after fixing the configuration can still be processed. The function
--    returns a status text: 'ok', 'duplicate' or 'unmatched:<reason>'; the webhook route logs loudly.
-- 2. An adjustment that is not blocking no longer rewrites a licence to 'active' unconditionally.
--    It restores only a licence that a refund/chargeback previously cancelled.
-- 3. Account deletion becomes possible: user_id on payment records is nullable, ON DELETE SET NULL.
-- 4. case_reminders gets claimed_at so two overlapping cron runs cannot both send the same reminder.

begin;

create table if not exists public.payment_events_unmatched (
  event_id text primary key,
  event_type text not null,
  reason text not null,
  payload jsonb not null,
  attempts integer not null default 1,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
alter table public.payment_events_unmatched enable row level security;
revoke all on public.payment_events_unmatched from anon, authenticated;

-- ---- 3. foreign keys to auth.users ----------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select c.conrelid::regclass as tbl, c.conname
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
    where c.contype = 'f'
      and c.confrelid = 'auth.users'::regclass
      and a.attname = 'user_id'
      and c.conrelid in ('public.licenses'::regclass, 'public.checkout_intents'::regclass,
                         'public.purchase_email_outbox'::regclass)
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
  end loop;
end $$;

alter table public.checkout_intents alter column user_id drop not null;
alter table public.purchase_email_outbox alter column user_id drop not null;
alter table public.licenses add constraint licenses_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;
alter table public.checkout_intents add constraint checkout_intents_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;
alter table public.purchase_email_outbox add constraint purchase_email_outbox_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

-- A purchase email for a deleted account is not sent (the cron claims with p_user_id null).
create or replace function public.claim_purchase_emails(p_user_id uuid default null)
returns setof public.purchase_email_outbox language sql security definer set search_path=public,pg_temp as $$
  update purchase_email_outbox set lease_until=now()+interval '2 minutes',lease_token=gen_random_uuid(),attempts=attempts+1
  where transaction_id in (select transaction_id from purchase_email_outbox
    where sent_at is null and user_id is not null and (lease_until is null or lease_until<now()) and (p_user_id is null or user_id=p_user_id)
    order by purchased_at limit 10 for update skip locked)
  returning *;
$$;
revoke all on function public.claim_purchase_emails(uuid) from public,anon,authenticated;
grant execute on function public.claim_purchase_emails(uuid) to service_role;

-- ---- 4. reminder claim ------------------------------------------------------------------------
alter table public.case_reminders add column if not exists claimed_at timestamptz;

-- ---- 1 + 2. apply_paddle_event ---------------------------------------------------------------
drop function if exists public.apply_paddle_event(jsonb, text);
create function public.apply_paddle_event(p_event jsonb, p_price_id text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  d jsonb := p_event->'data'; t text := p_event->>'event_type';
  eid text := p_event->>'event_id'; occurred timestamptz := (p_event->>'occurred_at')::timestamptz;
  txn text; intent checkout_intents%rowtype; intent_text text; park_reason text;
  blocked boolean; was_blocked boolean;
begin
  if eid is null or occurred is null then raise exception 'Missing event identity'; end if;
  -- Serialize all events for a transaction, including adjustments delivered before completion.
  txn := case when t = 'transaction.completed' then d->>'id' else d->>'transaction_id' end;
  perform pg_advisory_xact_lock(hashtextextended(coalesce(txn, d->>'id', eid), 0));
  if exists(select 1 from payment_events where event_id = eid) then return 'duplicate'; end if;

  if t = 'transaction.completed' then
    if p_price_id is null or p_price_id = '' then raise exception 'Price not configured'; end if;
    intent_text := d->'custom_data'->>'checkout_intent_id';
    if not exists(select 1 from jsonb_array_elements(coalesce(d->'items','[]'::jsonb)) item where item->'price'->>'id' = p_price_id) then
      park_reason := 'no item matches the configured price id (check NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS)';
    elsif txn is null then
      park_reason := 'transaction id missing';
    elsif intent_text is null or intent_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      park_reason := 'custom_data.checkout_intent_id missing or not a uuid';
    else
      select * into intent from checkout_intents where id = intent_text::uuid for update;
      if not found then park_reason := 'checkout intent not found';
      elsif intent.price_id <> p_price_id then park_reason := 'checkout intent price differs from configured price';
      elsif intent.transaction_id is not null and intent.transaction_id <> txn then park_reason := 'checkout intent already bound to a different transaction';
      elsif intent.user_id is null then park_reason := 'account for this checkout intent was deleted';
      end if;
    end if;
    if park_reason is not null then
      insert into payment_events_unmatched(event_id,event_type,reason,payload)
      values(eid,t,park_reason,p_event)
      on conflict(event_id) do update set attempts = payment_events_unmatched.attempts + 1,
        reason = excluded.reason, last_seen_at = now();
      return 'unmatched:' || park_reason;
    end if;
  end if;

  insert into payment_events(event_id,event_type,occurred_at) values(eid,t,occurred) on conflict do nothing;
  if not found then return 'duplicate'; end if;

  if t = 'transaction.completed' then
    delete from payment_events_unmatched where event_id = eid;
    select exists(select 1 from payment_adjustments a where a.transaction_id=txn and a.status='approved'
      and ((a.action='refund' and a.full_refund) or a.action='chargeback')
      and not exists(select 1 from payment_adjustments r where r.original_adjustment_id=a.id and r.action='chargeback_reverse' and r.status='approved')) into blocked;
    insert into licenses(license_key,email,user_id,case_id,plan,status,provider,provider_transaction_id,activated_at,provider_updated_at)
    values('AD-' || upper(replace(gen_random_uuid()::text,'-','')),intent.email,intent.user_id,intent.case_id,'appeal_pass',case when blocked then 'canceled' else 'active' end,'paddle',txn,occurred,occurred)
    on conflict(provider_transaction_id) where provider_transaction_id is not null do nothing;
    update checkout_intents set transaction_id=txn where id=intent.id;
    insert into purchase_email_outbox(transaction_id,user_id,email,purchased_at,consent_text)
    values(txn,intent.user_id,intent.email,occurred,intent.consent_text) on conflict do nothing;
  elsif t in ('adjustment.created','adjustment.updated') then
    if txn is null or d->>'id' is null then raise exception 'Missing adjustment identity'; end if;
    insert into payment_adjustments(id,transaction_id,action,status,full_refund,occurred_at,original_adjustment_id)
    values(d->>'id',txn,d->>'action',d->>'status',coalesce(d->>'type','')='full',occurred,d->>'original_adjustment_id')
    on conflict(id) do update set status=excluded.status, occurred_at=excluded.occurred_at
    where payment_adjustments.occurred_at <= excluded.occurred_at;
    select exists(select 1 from payment_adjustments a where a.transaction_id=txn and a.status='approved'
      and ((a.action='refund' and a.full_refund) or a.action='chargeback')
      and not exists(select 1 from payment_adjustments r where r.original_adjustment_id=a.id and r.action='chargeback_reverse' and r.status='approved')) into blocked;
    if blocked then
      update licenses set status='canceled', canceled_at=occurred, provider_updated_at=greatest(provider_updated_at,occurred)
      where provider='paddle' and provider_transaction_id=txn;
    else
      -- Restore only a licence that an adjustment itself blocked: it is canceled AND this
      -- transaction has a refund/chargeback record that is no longer in force. A licence cancelled
      -- by hand, or by anything else, is never touched.
      select exists(select 1 from payment_adjustments a where a.transaction_id=txn
        and ((a.action='refund' and a.full_refund) or a.action='chargeback')) into was_blocked;
      if was_blocked then
        update licenses set status='active', canceled_at=null, provider_updated_at=greatest(provider_updated_at,occurred)
        where provider='paddle' and provider_transaction_id=txn and status='canceled';
      end if;
    end if;
  elsif t in ('subscription.updated','subscription.activated','subscription.paused','subscription.canceled','subscription.past_due','subscription.resumed') then
    -- Guardian is not sold, but honor lifecycle events for any pre-existing subscription.
    if d->>'status' not in ('active','paused','canceled','past_due') then return 'ok'; end if;
    update licenses set status=d->>'status',provider_updated_at=occurred
    where provider='paddle' and provider_subscription_id=d->>'id'
      and (provider_updated_at is null or provider_updated_at <= occurred);
  end if;
  return 'ok';
end $$;
revoke all on function public.apply_paddle_event(jsonb,text) from public, anon, authenticated;
grant execute on function public.apply_paddle_event(jsonb,text) to service_role;

commit;
