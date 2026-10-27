-- 0027_refund_reversal_fixes.sql
-- Two defects in how a refund or chargeback is lifted, found in the 27 Oct 2026 audit. Both are in
-- the restore branch of apply_paddle_event_before_referrals; nothing else in that function changes.
--
-- 1. A credited upgrade could be restored while the purchase it was credited from stayed refunded.
--    Reversing a chargeback on the upgrade checked only the upgrade's own transaction, so the Pass
--    came back active at the discounted price and `refund_owed_at` was cleared. The restore now also
--    requires that the credited-from purchase has no live refund or chargeback. If the upgrade stays
--    cancelled, the debt is put back: its own payment is live again and the original is still refunded.
--
-- 2. A refund that was only awaiting approval reactivated a cancelled subscription. The restore ran
--    whenever the transaction had ever had a refund row, whatever its status, so a `pending_approval`
--    refund on a Pro plan cancelled by `subscription.canceled` turned it back to active. A restore
--    now happens only when this event actually lifts a block: an adjustment that had been approved
--    and no longer is (a rejected refund), or an approved `chargeback_reverse`.
--
-- 3. An Account Pass expiry notice that was claimed but never sent stayed claimed for good. The
--    notice row is written before the email goes out, and the only undo was in a caught exception, so
--    a crash or timeout in between left a row that later runs read as "already told". The row's
--    `sent_at` has always meant when it was claimed; `delivered_at` now records that the provider
--    accepted the email. A claim that was never delivered and is older than the lease is taken
--    again. Rows written before this migration were all treated as told, so they are marked so.
--
-- Apply after 0026. One transaction; re-running is safe (create or replace, add column if not exists).

begin;

alter table public.account_pass_notices add column if not exists delivered_at timestamptz;
update public.account_pass_notices set delivered_at = sent_at where delivered_at is null;

create or replace function public.apply_paddle_event_before_referrals(
  p_event jsonb, p_price_id text, p_account_price_id text default null, p_extra_prices jsonb default '{}'::jsonb
)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  d jsonb := p_event->'data'; t text := p_event->>'event_type';
  eid text := p_event->>'event_id'; occurred timestamptz := (p_event->>'occurred_at')::timestamptz;
  txn text; intent checkout_intents%rowtype; intent_text text; park_reason text;
  blocked boolean; was_blocked boolean; prev_status text;
  kinds jsonb := '{}'::jsonb; ek text; ev jsonb;
  matched_price text; pass_kind text; sub_id text; renewal boolean := false;
  pass_user uuid; pass_email text; lic_plan text; base_expiry timestamptz; credit_txn text;
begin
  if eid is null or occurred is null then raise exception 'Missing event identity'; end if;
  -- Serialize all events for a transaction, including adjustments delivered before completion.
  txn := case when t = 'transaction.completed' then d->>'id' else d->>'transaction_id' end;
  perform pg_advisory_xact_lock(hashtextextended(coalesce(txn, d->>'id', eid), 0));
  if exists(select 1 from payment_events where event_id = eid) then return 'duplicate'; end if;

  if t = 'transaction.completed' then
    if p_price_id is null or p_price_id = '' then raise exception 'Price not configured'; end if;
    intent_text := d->'custom_data'->>'checkout_intent_id';

    -- Which configured price was paid, as a map of price id to what it buys.
    kinds := jsonb_build_object(p_price_id, 'appeal_pass');
    if coalesce(p_account_price_id, '') <> '' then
      kinds := kinds || jsonb_build_object(p_account_price_id, 'account_pass');
    end if;
    for ek, ev in select key, value from jsonb_each(coalesce(p_extra_prices, '{}'::jsonb)) loop
      if ek in ('document_review', 'pass_after_review', 'pass_after_single', 'account_renewal', 'pack_10', 'pack_30', 'pro_plan', 'single_response')
         and jsonb_typeof(ev) = 'string' and (ev #>> '{}') <> '' then
        kinds := kinds || jsonb_build_object(ev #>> '{}', ek);
      end if;
    end loop;
    select item->'price'->>'id' into matched_price
      from jsonb_array_elements(coalesce(d->'items', '[]'::jsonb)) item
      where kinds ? (item->'price'->>'id')
      order by (item->'price'->>'id' = p_price_id) desc
      limit 1;
    if matched_price is not null then pass_kind := kinds ->> matched_price; end if;
    sub_id := d->>'subscription_id';

    -- A Pro plan's monthly payment has no checkout intent: it is recognised by its subscription.
    if pass_kind = 'pro_plan' and sub_id is not null
       and exists(select 1 from licenses where provider_subscription_id = sub_id and plan = 'pro_plan') then
      renewal := true;
      select user_id, email into pass_user, pass_email from licenses
        where provider_subscription_id = sub_id and plan = 'pro_plan' limit 1;
    end if;

    if matched_price is null then
      park_reason := 'no item matches a configured price id (check the NEXT_PUBLIC_PADDLE_PRICE_* variables)';
    elsif txn is null then
      park_reason := 'transaction id missing';
    elsif not renewal and (intent_text is null
          or intent_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') then
      park_reason := 'custom_data.checkout_intent_id missing or not a uuid';
    else
      if not renewal then
        select * into intent from checkout_intents where id = intent_text::uuid for update;
        if not found then park_reason := 'checkout intent not found';
        elsif intent.price_id <> matched_price then park_reason := 'checkout intent price differs from the price that was paid';
        elsif intent.transaction_id is not null and intent.transaction_id <> txn then park_reason := 'checkout intent already bound to a different transaction';
        elsif intent.user_id is null then park_reason := 'account for this checkout intent was deleted';
        else
          pass_user := intent.user_id; pass_email := intent.email;
        end if;
      end if;

      if park_reason is null then
        if pass_kind in ('appeal_pass', 'pass_after_review', 'pass_after_single') then
          -- One Pass per case. Serialized on the case so two payments cannot both pass this check.
          perform pg_advisory_xact_lock(hashtextextended('case:' || pass_user::text || ':' || intent.case_id, 0));
          if exists(select 1 from licenses where user_id = pass_user and case_id = intent.case_id
                    and plan = 'appeal_pass' and status = 'active'
                    and provider_transaction_id is distinct from txn) then
            park_reason := 'duplicate Pass: this case already has an active Appeal Pass; refund this transaction';
          elsif pass_kind = 'pass_after_review' and not exists(
                select 1 from licenses where user_id = pass_user and case_id = intent.case_id
                  and plan = 'document_review' and status = 'active') then
            park_reason := 'credited Appeal Pass without an active document review for this case; refund the difference';
          elsif pass_kind = 'pass_after_single' and not exists(
                select 1 from licenses where user_id = pass_user and case_id = intent.case_id
                  and plan = 'single_response' and status = 'active') then
            park_reason := 'credited Appeal Pass without an active One Response for this case; refund the difference';
          end if;
          -- The purchase the credit came from, so a refund of it can reach this upgrade. Null only
          -- for a legacy row with no payment reference, which Paddle could not refund anyway.
          if pass_kind = 'pass_after_review' then
            select provider_transaction_id into credit_txn from licenses
              where user_id = pass_user and case_id = intent.case_id
                and plan = 'document_review' and status = 'active'
              order by created_at desc limit 1;
          elsif pass_kind = 'pass_after_single' then
            select provider_transaction_id into credit_txn from licenses
              where user_id = pass_user and case_id = intent.case_id
                and plan = 'single_response' and status = 'active'
              order by created_at desc limit 1;
          end if;
        elsif pass_kind = 'single_response' then
          perform pg_advisory_xact_lock(hashtextextended('case:' || pass_user::text || ':' || intent.case_id, 0));
          if exists(select 1 from licenses where user_id = pass_user and case_id = intent.case_id
                    and plan = 'single_response' and status = 'active'
                    and provider_transaction_id is distinct from txn) then
            park_reason := 'duplicate One Response: this case already has one; refund this transaction';
          elsif exists(select 1 from licenses where user_id = pass_user and case_id = intent.case_id
                    and plan = 'appeal_pass' and status = 'active') then
            park_reason := 'One Response bought for a case that already has an active Appeal Pass; refund this transaction';
          elsif exists(select 1 from licenses where user_id = pass_user
                    and plan in ('account_pass', 'account_renewal') and status = 'active'
                    and (expires_at is null or expires_at > now())) then
            park_reason := 'One Response bought by an account with an active Account Pass; refund this transaction';
          end if;
        elsif pass_kind = 'account_pass' then
          perform pg_advisory_xact_lock(hashtextextended('account:' || pass_user::text, 0));
          if exists(select 1 from licenses where user_id = pass_user
                    and plan = 'account_pass' and status = 'active'
                    and (expires_at is null or expires_at > now())
                    and provider_transaction_id is distinct from txn) then
            park_reason := 'duplicate Account Pass: this account already has an active Account Pass; refund this transaction';
          end if;
        elsif pass_kind = 'document_review' then
          perform pg_advisory_xact_lock(hashtextextended('case:' || pass_user::text || ':' || intent.case_id, 0));
          if exists(select 1 from licenses where user_id = pass_user and case_id = intent.case_id
                    and plan = 'document_review' and status = 'active'
                    and provider_transaction_id is distinct from txn) then
            park_reason := 'duplicate document review: this case already has one; refund this transaction';
          end if;
        elsif pass_kind = 'account_renewal' then
          perform pg_advisory_xact_lock(hashtextextended('account:' || pass_user::text, 0));
          -- A renewal follows cover that has ended, so an expired row is a valid base.
          select max(expires_at) into base_expiry from licenses
            where user_id = pass_user and plan in ('account_pass', 'account_renewal')
              and status in ('active', 'expired') and expires_at is not null;
          if base_expiry is null then
            park_reason := 'renewal without an Account Pass to renew; refund this transaction';
          end if;
        elsif pass_kind in ('pack_10', 'pack_30') then
          if not exists(select 1 from pro_accounts where user_id = pass_user and status = 'verified') then
            park_reason := 'credit pack bought by an account that is not a verified professional; refund this transaction';
          end if;
        elsif pass_kind = 'pro_plan' and not renewal then
          if not exists(select 1 from pro_accounts where user_id = pass_user and status = 'verified') then
            park_reason := 'Pro plan bought by an account that is not a verified professional; refund this transaction';
          elsif exists(select 1 from licenses where user_id = pass_user and plan = 'pro_plan' and status = 'active'
                       and provider_transaction_id is distinct from txn) then
            park_reason := 'duplicate Pro plan: this account already has an active one; refund this transaction';
          end if;
        end if;
      end if;
    end if;
    if park_reason is not null then
      insert into payment_events_unmatched(event_id, event_type, reason, payload)
      values(eid, t, park_reason, p_event)
      on conflict(event_id) do update set attempts = payment_events_unmatched.attempts + 1,
        reason = excluded.reason, last_seen_at = now();
      return 'unmatched:' || park_reason;
    end if;
  end if;

  insert into payment_events(event_id, event_type, occurred_at) values(eid, t, occurred) on conflict do nothing;
  if not found then return 'duplicate'; end if;

  if t = 'transaction.completed' then
    delete from payment_events_unmatched where event_id = eid;
    select exists(select 1 from payment_adjustments a where a.transaction_id = txn and a.status = 'approved'
      and ((a.action = 'refund' and a.full_refund) or a.action = 'chargeback')
      and not exists(select 1 from payment_adjustments r where r.original_adjustment_id = a.id and r.action = 'chargeback_reverse' and r.status = 'approved')) into blocked;

    -- The replacement stands: a lapsed Account Pass (or renewal) stops counting as active, which is
    -- what frees licenses_one_active_account_pass for the row inserted below. History is kept.
    if pass_kind in ('account_pass', 'account_renewal') and not blocked then
      update licenses set status = 'expired', provider_updated_at = greatest(provider_updated_at, occurred)
      where user_id = pass_user and plan in ('account_pass', 'account_renewal')
        and status = 'active' and expires_at is not null and expires_at <= now();
    end if;

    if pass_kind in ('appeal_pass', 'pass_after_review', 'pass_after_single', 'account_pass', 'document_review', 'account_renewal', 'single_response') then
      lic_plan := case pass_kind when 'pass_after_review' then 'appeal_pass' when 'pass_after_single' then 'appeal_pass' else pass_kind end;
      insert into licenses(license_key, email, user_id, case_id, plan, status, provider, provider_transaction_id,
                           credit_transaction_id, activated_at, provider_updated_at, expires_at, provider_discount_id, provider_customer_id)
      values('AD-' || upper(replace(gen_random_uuid()::text, '-', '')), pass_email, pass_user,
        case when lic_plan in ('appeal_pass', 'document_review', 'single_response') then intent.case_id else null end,
        lic_plan, case when blocked then 'canceled' else 'active' end, 'paddle', txn,
        case when pass_kind in ('pass_after_review', 'pass_after_single') then credit_txn else null end,
        occurred, occurred,
        case pass_kind
          when 'account_pass' then occurred + interval '12 months'
          when 'account_renewal' then greatest(base_expiry, occurred) + interval '12 months'
          else null end,
        d->>'discount_id', d->>'customer_id')
      on conflict(provider_transaction_id) where provider_transaction_id is not null do nothing;
    elsif pass_kind in ('pack_10', 'pack_30') then
      insert into case_credits(user_id, source, transaction_id, granted, expires_at, canceled_at)
      values(pass_user, 'pack', txn, case pass_kind when 'pack_10' then 10 else 30 end,
        occurred + interval '12 months', case when blocked then occurred else null end)
      on conflict(transaction_id) where transaction_id is not null do nothing;
    elsif pass_kind = 'pro_plan' then
      if not renewal then
        insert into licenses(license_key, email, user_id, case_id, plan, status, provider, provider_transaction_id,
                             provider_subscription_id, activated_at, provider_updated_at,
                             provider_discount_id, provider_customer_id)
        values('AD-' || upper(replace(gen_random_uuid()::text, '-', '')), pass_email, pass_user, null,
          'pro_plan', case when blocked then 'canceled' else 'active' end, 'paddle', txn, sub_id, occurred, occurred,
          d->>'discount_id', d->>'customer_id')
        on conflict(provider_transaction_id) where provider_transaction_id is not null do nothing;
      end if;
      -- Ten credits a month; an unused one lasts one more month.
      insert into case_credits(user_id, source, transaction_id, granted, expires_at, canceled_at)
      values(pass_user, 'pro_plan', txn, 10, occurred + interval '2 months', case when blocked then occurred else null end)
      on conflict(transaction_id) where transaction_id is not null do nothing;
    end if;

    if not renewal then
      update checkout_intents set transaction_id = txn where id = intent.id;
      insert into purchase_email_outbox(transaction_id, user_id, email, purchased_at, consent_text, kind)
      values(txn, pass_user, pass_email, occurred, intent.consent_text,
        case pass_kind when 'pass_after_review' then 'appeal_pass' else pass_kind end)
      on conflict do nothing;
    end if;
  elsif t in ('adjustment.created', 'adjustment.updated') then
    if txn is null or d->>'id' is null then raise exception 'Missing adjustment identity'; end if;
    -- What this adjustment was before the event: a block is only lifted by an adjustment that had
    -- been approved, never by one that is merely arriving or still pending.
    select a.status into prev_status from payment_adjustments a where a.id = d->>'id';
    insert into payment_adjustments(id, transaction_id, action, status, full_refund, occurred_at, original_adjustment_id)
    values(d->>'id', txn, d->>'action', d->>'status', coalesce(d->>'type', '') = 'full', occurred, d->>'original_adjustment_id')
    on conflict(id) do update set status = excluded.status, occurred_at = excluded.occurred_at
    where payment_adjustments.occurred_at <= excluded.occurred_at;
    select exists(select 1 from payment_adjustments a where a.transaction_id = txn and a.status = 'approved'
      and ((a.action = 'refund' and a.full_refund) or a.action = 'chargeback')
      and not exists(select 1 from payment_adjustments r where r.original_adjustment_id = a.id and r.action = 'chargeback_reverse' and r.status = 'approved')) into blocked;
    if blocked then
      -- Refunding the original ends what was bought with its credit. It also marks the upgrade's
      -- own payment as owed back (26 Oct 2026): cancelling the Pass while keeping its $150 is the
      -- one outcome where the buyer loses both the product and the money. The daily ops digest
      -- reports the debt until the upgrade's refund event clears it below.
      update licenses l
      set status = 'canceled', canceled_at = occurred,
          refund_owed_at = case
            when l.credit_transaction_id = txn and l.provider_transaction_id is distinct from txn
              and not exists (
                select 1 from payment_adjustments a
                where a.transaction_id = l.provider_transaction_id and a.status = 'approved'
                  and ((a.action = 'refund' and a.full_refund) or a.action = 'chargeback')
                  and not exists (select 1 from payment_adjustments r
                    where r.original_adjustment_id = a.id and r.action = 'chargeback_reverse'
                      and r.status = 'approved'))
            then coalesce(l.refund_owed_at, occurred)
            else l.refund_owed_at
          end,
          provider_updated_at = greatest(l.provider_updated_at, occurred)
      where l.provider = 'paddle' and (l.provider_transaction_id = txn or l.credit_transaction_id = txn);
      -- This transaction's own payment has come back: nothing is owed for it any more.
      update licenses set refund_owed_at = null
      where provider = 'paddle' and provider_transaction_id = txn and refund_owed_at is not null;
      -- A refunded pack or monthly grant can no longer be spent; cases it already activated stay.
      update case_credits set canceled_at = occurred where transaction_id = txn and canceled_at is null;
    else
      select exists(select 1 from payment_adjustments a where a.transaction_id = txn
        and ((a.action = 'refund' and a.full_refund) or a.action = 'chargeback'))
        and ((prev_status = 'approved' and d->>'status' is distinct from 'approved')
          or (d->>'action' = 'chargeback_reverse' and d->>'status' = 'approved'
              and prev_status is distinct from 'approved')) into was_blocked;
      if was_blocked then
        -- Not when the seller has bought another Pass of the same kind since: restoring this one
        -- would make two active Passes for one case (or two Account Passes, document reviews, One
        -- Responses or Pro plans), which the unique indexes refuse, and the webhook would then fail
        -- and be retried forever. The restored payment stays cancelled and is a refund to settle by
        -- hand. A One Response is not restored either when its case now has an Appeal Pass.
        -- A linked upgrade is restored with the original, but only when its own transaction has no
        -- live refund or chargeback of its own still standing (rule c).
        update licenses l set status = 'active', canceled_at = null, refund_owed_at = null, provider_updated_at = greatest(l.provider_updated_at, occurred)
        where l.provider = 'paddle' and l.status = 'canceled'
          and (l.provider_transaction_id = txn or l.credit_transaction_id = txn)
          and not exists (select 1 from payment_adjustments a where a.transaction_id = l.provider_transaction_id
            and a.status = 'approved'
            and ((a.action = 'refund' and a.full_refund) or a.action = 'chargeback')
            and not exists (select 1 from payment_adjustments r where r.original_adjustment_id = a.id
              and r.action = 'chargeback_reverse' and r.status = 'approved'))
          -- 27 Oct 2026: a credited upgrade also needs the purchase it was credited from to be live.
          and (l.credit_transaction_id is null or not exists (
            select 1 from payment_adjustments c where c.transaction_id = l.credit_transaction_id
              and c.status = 'approved'
              and ((c.action = 'refund' and c.full_refund) or c.action = 'chargeback')
              and not exists (select 1 from payment_adjustments r where r.original_adjustment_id = c.id
                and r.action = 'chargeback_reverse' and r.status = 'approved')))
          and not exists (select 1 from licenses o where o.user_id = l.user_id and o.status = 'active' and o.id <> l.id
            and ((l.plan = 'appeal_pass' and o.plan = 'appeal_pass' and o.case_id = l.case_id)
              or (l.plan = 'account_pass' and o.plan = 'account_pass')
              or (l.plan = 'document_review' and o.plan = 'document_review' and o.case_id = l.case_id)
              or (l.plan = 'single_response' and o.plan in ('single_response', 'appeal_pass') and o.case_id = l.case_id)
              or (l.plan = 'pro_plan' and o.plan = 'pro_plan')));
        -- An upgrade left cancelled because its original is still refunded: its own payment is live
        -- again, so the buyer is owed it back (the debt was cleared when its chargeback arrived).
        update licenses l set refund_owed_at = occurred
        where l.provider = 'paddle' and l.status = 'canceled' and l.refund_owed_at is null
          and l.provider_transaction_id = txn and l.credit_transaction_id is not null
          and exists (
            select 1 from payment_adjustments c where c.transaction_id = l.credit_transaction_id
              and c.status = 'approved'
              and ((c.action = 'refund' and c.full_refund) or c.action = 'chargeback')
              and not exists (select 1 from payment_adjustments r where r.original_adjustment_id = c.id
                and r.action = 'chargeback_reverse' and r.status = 'approved'))
          and not exists (
            select 1 from payment_adjustments a where a.transaction_id = l.provider_transaction_id
              and a.status = 'approved'
              and ((a.action = 'refund' and a.full_refund) or a.action = 'chargeback')
              and not exists (select 1 from payment_adjustments r where r.original_adjustment_id = a.id
                and r.action = 'chargeback_reverse' and r.status = 'approved'));
        update case_credits set canceled_at = null where transaction_id = txn and canceled_at is not null;
      end if;
    end if;
  elsif t in ('subscription.updated', 'subscription.activated', 'subscription.paused', 'subscription.canceled', 'subscription.past_due', 'subscription.resumed') then
    if d->>'status' not in ('active', 'paused', 'canceled', 'past_due') then return 'ok'; end if;
    update licenses set status = d->>'status', provider_updated_at = occurred
    where provider = 'paddle' and provider_subscription_id = d->>'id'
      and (provider_updated_at is null or provider_updated_at <= occurred);
  end if;
  return 'ok';
end $$;


commit;
