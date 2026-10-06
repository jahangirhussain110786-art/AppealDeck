-- 0015_hardening_followups.sql
-- Follow-ups from the 7 Oct 2026 configuration review.
-- 1. apply_paddle_event: a refund reversal no longer re-activates a licence when another active Pass
--    already covers the same case (it would violate the unique index from 0014 and make the webhook
--    fail and retry forever).
-- 2. enforce_device_cap gets the same search_path (public, pg_temp) as every other definer function.
-- 3. Tables that rely on RLS alone also have the default anon/authenticated grants revoked, so one
--    added policy by mistake cannot expose them.

begin;

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
      else
        -- One Pass per case. Serialized on the case so two payments cannot both pass this check.
        perform pg_advisory_xact_lock(hashtextextended('case:' || intent.user_id::text || ':' || intent.case_id, 0));
        if exists(select 1 from licenses where user_id = intent.user_id and case_id = intent.case_id
                  and plan = 'appeal_pass' and status = 'active'
                  and provider_transaction_id is distinct from txn) then
          park_reason := 'duplicate Pass: this case already has an active Appeal Pass; refund this transaction';
        end if;
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
      select exists(select 1 from payment_adjustments a where a.transaction_id=txn
        and ((a.action='refund' and a.full_refund) or a.action='chargeback')) into was_blocked;
      if was_blocked then
        -- Not when the seller has bought another Pass for the same case since: restoring this one
        -- would make two active Passes for one case, which the unique index refuses (and the
        -- webhook would then fail and be retried forever). The restored payment stays cancelled
        -- and is a refund to settle by hand.
        update licenses l set status='active', canceled_at=null, provider_updated_at=greatest(l.provider_updated_at,occurred)
        where l.provider='paddle' and l.provider_transaction_id=txn and l.status='canceled'
          and not exists (select 1 from licenses o where o.user_id=l.user_id and o.case_id=l.case_id
            and o.plan='appeal_pass' and o.status='active' and o.id<>l.id);
      end if;
    end if;
  elsif t in ('subscription.updated','subscription.activated','subscription.paused','subscription.canceled','subscription.past_due','subscription.resumed') then
    if d->>'status' not in ('active','paused','canceled','past_due') then return 'ok'; end if;
    update licenses set status=d->>'status',provider_updated_at=occurred
    where provider='paddle' and provider_subscription_id=d->>'id'
      and (provider_updated_at is null or provider_updated_at <= occurred);
  end if;
  return 'ok';
end $$;
revoke all on function public.apply_paddle_event(jsonb,text) from public, anon, authenticated;
grant execute on function public.apply_paddle_event(jsonb,text) to service_role;


create or replace function public.enforce_device_cap() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.revoked_at is not null then return new; end if;
  if TG_OP = 'UPDATE' then
    if old.revoked_at is null and old.license_id = new.license_id then return new; end if;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('device:' || new.license_id::text, 0));
  if (select count(*) from public.license_devices where license_id = new.license_id and revoked_at is null and id <> new.id) >= 5 then
    raise exception 'Device cap reached' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_device_cap() from public, anon, authenticated;

revoke all on public.outcome_events from anon, authenticated;
revoke all on public.case_reminders from anon, authenticated;

commit;
