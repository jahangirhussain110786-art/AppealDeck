-- 0021_pass_after_single.sql
-- The credited upgrade from One Response to the Appeal Pass (23 Oct 2026). A seller who bought a
-- One Response ($99) and reaches round two would otherwise pay the full Appeal Pass price on top. This
-- adds a second Appeal Pass price for exactly that case, with the One Response's price taken off, as
-- 0018 did for the AI document review ('pass_after_review').
--
-- It is inert until NEXT_PUBLIC_PADDLE_PRICE_PASS_AFTER_SINGLE is configured and the app passes that
-- price to apply_paddle_event in the extra-prices map, so applying this file earlier or later than the
-- price changes nothing for anyone who is not buying it.
--
-- What it changes
--   apply_paddle_event: the 0020 function with one more kind, 'pass_after_single'. It makes an Appeal
--   Pass for the case, exactly like 'appeal_pass' and 'pass_after_review', and parks the payment (for a
--   refund of the difference by hand) when the case has no live One Response, or already has an Appeal
--   Pass. Every other path is unchanged on purpose and is tested against a real Postgres.
--
-- Apply after 0020. It is one transaction: if anything is wrong it changes nothing.

begin;

-- the payment function -----------------------------------------------------------------------
drop function if exists public.apply_paddle_event(jsonb, text);
drop function if exists public.apply_paddle_event(jsonb, text, text);
drop function if exists public.apply_paddle_event(jsonb, text, text, jsonb);
create function public.apply_paddle_event(
  p_event jsonb, p_price_id text, p_account_price_id text default null, p_extra_prices jsonb default '{}'::jsonb
)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  d jsonb := p_event->'data'; t text := p_event->>'event_type';
  eid text := p_event->>'event_id'; occurred timestamptz := (p_event->>'occurred_at')::timestamptz;
  txn text; intent checkout_intents%rowtype; intent_text text; park_reason text;
  blocked boolean; was_blocked boolean;
  kinds jsonb := '{}'::jsonb; ek text; ev jsonb;
  matched_price text; pass_kind text; sub_id text; renewal boolean := false;
  pass_user uuid; pass_email text; lic_plan text; base_expiry timestamptz;
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
          select max(expires_at) into base_expiry from licenses
            where user_id = pass_user and plan in ('account_pass', 'account_renewal')
              and status = 'active' and expires_at is not null;
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

    if pass_kind in ('appeal_pass', 'pass_after_review', 'pass_after_single', 'account_pass', 'document_review', 'account_renewal', 'single_response') then
      lic_plan := case pass_kind when 'pass_after_review' then 'appeal_pass' when 'pass_after_single' then 'appeal_pass' else pass_kind end;
      insert into licenses(license_key, email, user_id, case_id, plan, status, provider, provider_transaction_id,
                           activated_at, provider_updated_at, expires_at, provider_discount_id, provider_customer_id)
      values('AD-' || upper(replace(gen_random_uuid()::text, '-', '')), pass_email, pass_user,
        case when lic_plan in ('appeal_pass', 'document_review', 'single_response') then intent.case_id else null end,
        lic_plan, case when blocked then 'canceled' else 'active' end, 'paddle', txn, occurred, occurred,
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
        case pass_kind when 'pass_after_review' then 'appeal_pass' when 'pass_after_single' then 'appeal_pass' else pass_kind end)
      on conflict do nothing;
    end if;
  elsif t in ('adjustment.created', 'adjustment.updated') then
    if txn is null or d->>'id' is null then raise exception 'Missing adjustment identity'; end if;
    insert into payment_adjustments(id, transaction_id, action, status, full_refund, occurred_at, original_adjustment_id)
    values(d->>'id', txn, d->>'action', d->>'status', coalesce(d->>'type', '') = 'full', occurred, d->>'original_adjustment_id')
    on conflict(id) do update set status = excluded.status, occurred_at = excluded.occurred_at
    where payment_adjustments.occurred_at <= excluded.occurred_at;
    select exists(select 1 from payment_adjustments a where a.transaction_id = txn and a.status = 'approved'
      and ((a.action = 'refund' and a.full_refund) or a.action = 'chargeback')
      and not exists(select 1 from payment_adjustments r where r.original_adjustment_id = a.id and r.action = 'chargeback_reverse' and r.status = 'approved')) into blocked;
    if blocked then
      update licenses set status = 'canceled', canceled_at = occurred, provider_updated_at = greatest(provider_updated_at, occurred)
      where provider = 'paddle' and provider_transaction_id = txn;
      -- A refunded pack or monthly grant can no longer be spent; cases it already activated stay.
      update case_credits set canceled_at = occurred where transaction_id = txn and canceled_at is null;
    else
      select exists(select 1 from payment_adjustments a where a.transaction_id = txn
        and ((a.action = 'refund' and a.full_refund) or a.action = 'chargeback')) into was_blocked;
      if was_blocked then
        -- Not when the seller has bought another Pass of the same kind since: restoring this one
        -- would make two active Passes for one case (or two Account Passes, document reviews, One
        -- Responses or Pro plans), which the unique indexes refuse, and the webhook would then fail
        -- and be retried forever. The restored payment stays cancelled and is a refund to settle by
        -- hand. A One Response is not restored either when its case now has an Appeal Pass.
        update licenses l set status = 'active', canceled_at = null, provider_updated_at = greatest(l.provider_updated_at, occurred)
        where l.provider = 'paddle' and l.provider_transaction_id = txn and l.status = 'canceled'
          and not exists (select 1 from licenses o where o.user_id = l.user_id and o.status = 'active' and o.id <> l.id
            and ((l.plan = 'appeal_pass' and o.plan = 'appeal_pass' and o.case_id = l.case_id)
              or (l.plan = 'account_pass' and o.plan = 'account_pass')
              or (l.plan = 'document_review' and o.plan = 'document_review' and o.case_id = l.case_id)
              or (l.plan = 'single_response' and o.plan in ('single_response', 'appeal_pass') and o.case_id = l.case_id)
              or (l.plan = 'pro_plan' and o.plan = 'pro_plan')));
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
revoke all on function public.apply_paddle_event(jsonb, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.apply_paddle_event(jsonb, text, text, jsonb) to service_role;

commit;
