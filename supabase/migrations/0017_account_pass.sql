-- 0017_account_pass.sql
-- The Account Pass (22 Oct 2026, stage 2 of docs/handoffs/2026-10-22-combined-growth-plan.md): one
-- payment that covers every case of one account for 12 months, beside the per-case Appeal Pass.
--
-- Nothing in the app uses this until NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS is set, and the app
-- only passes the new argument to apply_paddle_event when that variable is set, so applying this
-- file earlier or later than the price changes nothing for anyone who is not buying an Account Pass.
--
-- 1. licenses.plan may be 'account_pass'. An Account Pass row has case_id NULL and expires_at set
--    to twelve months after the payment. (The older "unassigned appeal_pass binds to its first case"
--    rule in claim_case_pass applies only to plan = 'appeal_pass', so an Account Pass is never bound.)
-- 2. At most one active Account Pass per account (a second payment is PARKED for a manual refund,
--    like a duplicate case Pass), with a partial unique index as the backstop.
-- 3. apply_paddle_event accepts a second price id and creates the right kind of licence. It is the
--    0015 function with only those changes; everything else is unchanged on purpose.
-- 4. claim_case_pass returns true for an account holding an unexpired Account Pass, before it would
--    bind a floating legacy Pass, so an Account Pass never wastes one.
--
-- Apply after 0016. If the unique index fails, two active Account Passes already exist for one
-- account; there are none until this file has been applied, so it should not.
--
-- After applying, run supabase/tests/account_pass.sql in the SQL editor: it rolls back its own data.

begin;

alter table public.licenses drop constraint if exists licenses_plan_check;
alter table public.licenses
  add constraint licenses_plan_check check (plan in ('appeal_pass', 'guardian_sub', 'account_pass'));

create unique index if not exists licenses_one_active_account_pass
  on public.licenses (user_id)
  where status = 'active' and plan = 'account_pass';

drop function if exists public.apply_paddle_event(jsonb, text);
drop function if exists public.apply_paddle_event(jsonb, text, text);
create function public.apply_paddle_event(p_event jsonb, p_price_id text, p_account_price_id text default null)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  d jsonb := p_event->'data'; t text := p_event->>'event_type';
  eid text := p_event->>'event_id'; occurred timestamptz := (p_event->>'occurred_at')::timestamptz;
  txn text; intent checkout_intents%rowtype; intent_text text; park_reason text;
  blocked boolean; was_blocked boolean;
  matched_price text; pass_plan text;
begin
  if eid is null or occurred is null then raise exception 'Missing event identity'; end if;
  -- Serialize all events for a transaction, including adjustments delivered before completion.
  txn := case when t = 'transaction.completed' then d->>'id' else d->>'transaction_id' end;
  perform pg_advisory_xact_lock(hashtextextended(coalesce(txn, d->>'id', eid), 0));
  if exists(select 1 from payment_events where event_id = eid) then return 'duplicate'; end if;

  if t = 'transaction.completed' then
    if p_price_id is null or p_price_id = '' then raise exception 'Price not configured'; end if;
    intent_text := d->'custom_data'->>'checkout_intent_id';
    -- Which configured price was paid: the Appeal Pass price, or the Account Pass price when one is
    -- configured. The Appeal Pass price wins if a transaction somehow carried both.
    select item->'price'->>'id' into matched_price
      from jsonb_array_elements(coalesce(d->'items','[]'::jsonb)) item
      where item->'price'->>'id' = p_price_id
         or (coalesce(p_account_price_id, '') <> '' and item->'price'->>'id' = p_account_price_id)
      order by (item->'price'->>'id' = p_price_id) desc
      limit 1;
    if matched_price is not null then
      pass_plan := case when matched_price = p_price_id then 'appeal_pass' else 'account_pass' end;
    end if;
    if matched_price is null then
      park_reason := 'no item matches a configured price id (check NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS and NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS)';
    elsif txn is null then
      park_reason := 'transaction id missing';
    elsif intent_text is null or intent_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      park_reason := 'custom_data.checkout_intent_id missing or not a uuid';
    else
      select * into intent from checkout_intents where id = intent_text::uuid for update;
      if not found then park_reason := 'checkout intent not found';
      elsif intent.price_id <> matched_price then park_reason := 'checkout intent price differs from the price that was paid';
      elsif intent.transaction_id is not null and intent.transaction_id <> txn then park_reason := 'checkout intent already bound to a different transaction';
      elsif intent.user_id is null then park_reason := 'account for this checkout intent was deleted';
      elsif pass_plan = 'appeal_pass' then
        -- One Pass per case. Serialized on the case so two payments cannot both pass this check.
        perform pg_advisory_xact_lock(hashtextextended('case:' || intent.user_id::text || ':' || intent.case_id, 0));
        if exists(select 1 from licenses where user_id = intent.user_id and case_id = intent.case_id
                  and plan = 'appeal_pass' and status = 'active'
                  and provider_transaction_id is distinct from txn) then
          park_reason := 'duplicate Pass: this case already has an active Appeal Pass; refund this transaction';
        end if;
      else
        -- One Account Pass per account, serialized on the account.
        perform pg_advisory_xact_lock(hashtextextended('account:' || intent.user_id::text, 0));
        if exists(select 1 from licenses where user_id = intent.user_id
                  and plan = 'account_pass' and status = 'active'
                  and (expires_at is null or expires_at > now())
                  and provider_transaction_id is distinct from txn) then
          park_reason := 'duplicate Account Pass: this account already has an active Account Pass; refund this transaction';
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
    insert into licenses(license_key,email,user_id,case_id,plan,status,provider,provider_transaction_id,activated_at,provider_updated_at,expires_at)
    values('AD-' || upper(replace(gen_random_uuid()::text,'-','')),intent.email,intent.user_id,
      case when pass_plan = 'appeal_pass' then intent.case_id else null end,
      pass_plan,case when blocked then 'canceled' else 'active' end,'paddle',txn,occurred,occurred,
      case when pass_plan = 'account_pass' then occurred + interval '12 months' else null end)
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
        -- Not when the seller has bought another Pass of the same kind since: restoring this one
        -- would make two active Passes for one case (or two Account Passes for one account), which
        -- the unique indexes refuse, and the webhook would then fail and be retried forever. The
        -- restored payment stays cancelled and is a refund to settle by hand.
        update licenses l set status='active', canceled_at=null, provider_updated_at=greatest(l.provider_updated_at,occurred)
        where l.provider='paddle' and l.provider_transaction_id=txn and l.status='canceled'
          and not exists (select 1 from licenses o where o.user_id=l.user_id and o.status='active' and o.id<>l.id
            and ((l.plan='appeal_pass' and o.plan='appeal_pass' and o.case_id=l.case_id)
              or (l.plan='account_pass' and o.plan='account_pass')));
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
revoke all on function public.apply_paddle_event(jsonb,text,text) from public, anon, authenticated;
grant execute on function public.apply_paddle_event(jsonb,text,text) to service_role;

-- A seller holding an unexpired Account Pass is covered for any case, without binding anything.
create or replace function public.claim_case_pass(p_user_id uuid,p_case_id text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare chosen uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  if exists(select 1 from licenses where user_id=p_user_id and status='active' and plan='appeal_pass' and case_id=p_case_id and (expires_at is null or expires_at>now())) then return true; end if;
  if exists(select 1 from licenses where user_id=p_user_id and status='active' and plan='account_pass' and (expires_at is null or expires_at>now())) then return true; end if;
  select id into chosen from licenses where user_id=p_user_id and status='active' and plan='appeal_pass' and case_id is null and (expires_at is null or expires_at>now()) order by created_at limit 1 for update;
  if chosen is null then return false; end if;
  update licenses set case_id=p_case_id where id=chosen;
  return true;
end $$;
revoke all on function public.claim_case_pass(uuid,text) from public, anon, authenticated;
grant execute on function public.claim_case_pass(uuid,text) to service_role;

commit;
