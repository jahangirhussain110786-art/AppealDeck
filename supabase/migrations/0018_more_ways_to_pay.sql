-- 0018_more_ways_to_pay.sql
-- Stage 3 of docs/handoffs/2026-10-22-combined-growth-plan.md (22 Oct 2026). Everything here is
-- inert until its Paddle price is configured and the app is told about it, and the app passes the
-- new argument to apply_paddle_event only when at least one of those prices is configured, so
-- applying this file earlier or later than the prices changes nothing for anyone not buying them.
--
-- What it adds
--   1. Plans: 'document_review' (AI reading of one case's documents), 'account_renewal' (twelve
--      more months on an Account Pass), 'pro_plan' (a professional's monthly subscription).
--   2. licenses.provider_discount_id and provider_customer_id, so partner commissions can be worked
--      out from our own table and a subscriber's billing portal can be opened.
--   3. pro_accounts: professionals the founder has verified by hand. case_credits and credit_uses:
--      credits that activate one case each, bought in packs or granted by the Pro plan.
--   4. account_pass_notices: one "your Account Pass ends soon" email per account per end date.
--   5. purchase_email_outbox.kind, so the confirmation email names what was bought.
--   6. apply_paddle_event takes a map of the extra price ids and creates the right thing for each.
--      It is the 0017 function with the new kinds added; the Appeal Pass and Account Pass paths are
--      unchanged on purpose and are tested against a real Postgres in
--      src/lib/__tests__/paymentSql.test.ts.
--   7. claim_case_pass also honours an Account renewal; claim_document_review and use_case_credit
--      are new.
--
-- Apply after 0017. It is one transaction: if anything is wrong it changes nothing.
--
-- Verifying a professional (run in the SQL editor, with their sign-in email):
--   insert into pro_accounts(user_id, status, business_name, profile_url)
--   select id, 'verified', 'Their business', 'https://their-public-profile' from auth.users
--   where email = 'them@example.com';

begin;

-- 1. plans ----------------------------------------------------------------------------------
alter table public.licenses drop constraint if exists licenses_plan_check;
alter table public.licenses
  add constraint licenses_plan_check
  check (plan in ('appeal_pass', 'guardian_sub', 'account_pass', 'account_renewal', 'document_review', 'pro_plan'));

-- At most one live document review per case, and one Pro subscription per account (backstops).
create unique index if not exists licenses_one_active_document_review
  on public.licenses (user_id, case_id)
  where status = 'active' and plan = 'document_review' and case_id is not null;
create unique index if not exists licenses_one_active_pro_plan
  on public.licenses (user_id)
  where status = 'active' and plan = 'pro_plan';

-- 2. discount and customer ids ------------------------------------------------------------------
alter table public.licenses add column if not exists provider_discount_id text;
alter table public.licenses add column if not exists provider_customer_id text;

-- 3. professionals and credits ------------------------------------------------------------------
create table if not exists public.pro_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'verified' check (status in ('verified', 'suspended')),
  business_name text,
  profile_url text,
  verified_at timestamptz not null default now(),
  note text
);

create table if not exists public.case_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('pack', 'pro_plan', 'grant')),
  transaction_id text,
  granted integer not null check (granted > 0),
  used integer not null default 0,
  expires_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  check (used >= 0 and used <= granted)
);
create unique index if not exists case_credits_transaction_unique
  on public.case_credits (transaction_id) where transaction_id is not null;
create index if not exists case_credits_user on public.case_credits (user_id);

create table if not exists public.credit_uses (
  id uuid primary key default gen_random_uuid(),
  credit_id uuid not null references public.case_credits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id text not null,
  used_at timestamptz not null default now(),
  unique (user_id, case_id)
);

-- 4. expiry notices -----------------------------------------------------------------------------
create table if not exists public.account_pass_notices (
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_on date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, expires_on)
);

-- Service role only: no policy is added, and the default grants are taken away.
alter table public.pro_accounts enable row level security;
alter table public.case_credits enable row level security;
alter table public.credit_uses enable row level security;
alter table public.account_pass_notices enable row level security;
revoke all on public.pro_accounts, public.case_credits, public.credit_uses, public.account_pass_notices
  from anon, authenticated;

-- 5. what the confirmation email is about ------------------------------------------------------
alter table public.purchase_email_outbox add column if not exists kind text not null default 'appeal_pass';

-- 6. the payment function -----------------------------------------------------------------------
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
      if ek in ('document_review', 'pass_after_review', 'account_renewal', 'pack_10', 'pack_30', 'pro_plan')
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
        if pass_kind in ('appeal_pass', 'pass_after_review') then
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

    if pass_kind in ('appeal_pass', 'pass_after_review', 'account_pass', 'document_review', 'account_renewal') then
      lic_plan := case pass_kind when 'pass_after_review' then 'appeal_pass' else pass_kind end;
      insert into licenses(license_key, email, user_id, case_id, plan, status, provider, provider_transaction_id,
                           activated_at, provider_updated_at, expires_at, provider_discount_id, provider_customer_id)
      values('AD-' || upper(replace(gen_random_uuid()::text, '-', '')), pass_email, pass_user,
        case when lic_plan in ('appeal_pass', 'document_review') then intent.case_id else null end,
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
        case pass_kind when 'pass_after_review' then 'appeal_pass' else pass_kind end)
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
        -- would make two active Passes for one case (or two Account Passes, document reviews or Pro
        -- plans), which the unique indexes refuse, and the webhook would then fail and be retried
        -- forever. The restored payment stays cancelled and is a refund to settle by hand.
        update licenses l set status = 'active', canceled_at = null, provider_updated_at = greatest(l.provider_updated_at, occurred)
        where l.provider = 'paddle' and l.provider_transaction_id = txn and l.status = 'canceled'
          and not exists (select 1 from licenses o where o.user_id = l.user_id and o.status = 'active' and o.id <> l.id
            and ((l.plan = 'appeal_pass' and o.plan = 'appeal_pass' and o.case_id = l.case_id)
              or (l.plan = 'account_pass' and o.plan = 'account_pass')
              or (l.plan = 'document_review' and o.plan = 'document_review' and o.case_id = l.case_id)
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

-- 7. who is covered -------------------------------------------------------------------------------
-- A seller holding an unexpired Account Pass (or a renewal of one) is covered for any case,
-- without binding anything to a case.
create or replace function public.claim_case_pass(p_user_id uuid, p_case_id text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare chosen uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  if exists(select 1 from licenses where user_id = p_user_id and status = 'active' and plan = 'appeal_pass' and case_id = p_case_id and (expires_at is null or expires_at > now())) then return true; end if;
  if exists(select 1 from licenses where user_id = p_user_id and status = 'active' and plan in ('account_pass', 'account_renewal') and (expires_at is null or expires_at > now())) then return true; end if;
  select id into chosen from licenses where user_id = p_user_id and status = 'active' and plan = 'appeal_pass' and case_id is null and (expires_at is null or expires_at > now()) order by created_at limit 1 for update;
  if chosen is null then return false; end if;
  update licenses set case_id = p_case_id where id = chosen;
  return true;
end $$;
revoke all on function public.claim_case_pass(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_case_pass(uuid, text) to service_role;

-- The AI reading of documents: covered by any Pass for the case, or by a document review for it.
create or replace function public.claim_document_review(p_user_id uuid, p_case_id text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if public.claim_case_pass(p_user_id, p_case_id) then return true; end if;
  return exists(select 1 from licenses where user_id = p_user_id and status = 'active'
    and plan = 'document_review' and case_id = p_case_id and (expires_at is null or expires_at > now()));
end $$;
revoke all on function public.claim_document_review(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_document_review(uuid, text) to service_role;

-- A verified professional spends one credit to activate one case. Returns what happened:
--   'used' (a credit was spent and the case now has an Appeal Pass), 'covered' (it already had
--   cover, nothing spent), 'already_used' (a credit once activated this case), 'not_verified', or
--   'no_credit'.
create or replace function public.use_case_credit(p_user_id uuid, p_case_id text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare c case_credits%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  perform pg_advisory_xact_lock(hashtextextended('case:' || p_user_id::text || ':' || p_case_id, 0));
  if exists(select 1 from licenses where user_id = p_user_id and status = 'active'
            and (expires_at is null or expires_at > now())
            and ((plan = 'appeal_pass' and case_id = p_case_id) or plan in ('account_pass', 'account_renewal'))) then
    return 'covered';
  end if;
  if not exists(select 1 from pro_accounts where user_id = p_user_id and status = 'verified') then
    return 'not_verified';
  end if;
  select * into c from case_credits
    where user_id = p_user_id and canceled_at is null and used < granted
      and (expires_at is null or expires_at > now())
    order by expires_at nulls last, created_at limit 1 for update;
  if not found then return 'no_credit'; end if;
  -- A case is activated by a credit at most once, even if its Pass was later cancelled by hand.
  insert into credit_uses(credit_id, user_id, case_id) values(c.id, p_user_id, p_case_id)
    on conflict (user_id, case_id) do nothing;
  if not found then return 'already_used'; end if;
  insert into licenses(license_key, email, user_id, case_id, plan, status, provider, activated_at)
  values('AD-' || upper(replace(gen_random_uuid()::text, '-', '')),
    (select email from auth.users where id = p_user_id), p_user_id, p_case_id, 'appeal_pass', 'active', 'credit', now());
  update case_credits set used = used + 1 where id = c.id;
  return 'used';
end $$;
revoke all on function public.use_case_credit(uuid, text) from public, anon, authenticated;
grant execute on function public.use_case_credit(uuid, text) to service_role;

commit;
