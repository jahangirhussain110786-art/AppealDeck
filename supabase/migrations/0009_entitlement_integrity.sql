-- Account-owned, per-case entitlements. Existing purchases are preserved; unknown ownership
-- is not guessed from an unverified signup email. Apply before deploying the new app.
begin;
alter table public.licenses add column if not exists user_id uuid references auth.users(id);
alter table public.licenses add column if not exists case_id text;
alter table public.licenses add column if not exists provider_transaction_id text;
alter table public.licenses add column if not exists provider_updated_at timestamptz;
create unique index if not exists licenses_transaction_unique on public.licenses(provider_transaction_id) where provider_transaction_id is not null;
create index if not exists licenses_user_status on public.licenses(user_id, status);
drop policy if exists licenses_update_own on public.licenses;
drop policy if exists licenses_select_own on public.licenses;
revoke insert, update, delete on public.licenses from anon, authenticated;
create policy licenses_select_own on public.licenses for select to authenticated using(user_id = auth.uid());
drop policy if exists license_devices_select_own on public.license_devices;
drop policy if exists license_devices_delete_own on public.license_devices;
create policy license_devices_select_own on public.license_devices for select to authenticated using(exists(select 1 from public.licenses l where l.id=license_id and l.user_id=auth.uid()));
revoke insert, update, delete on public.license_devices from anon, authenticated;
drop policy if exists license_events_select_own on public.license_events;
create policy license_events_select_own on public.license_events for select to authenticated using(exists(select 1 from public.licenses l where l.id=license_id and l.user_id=auth.uid()));
-- Local development grants are explicitly not historical paid purchases.
update public.licenses l set user_id = u.id from auth.users u
where l.user_id is null and l.provider = 'dev-grant' and lower(l.email) = lower(u.email);

create table if not exists public.checkout_intents (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
  case_id text not null, email text not null, price_id text not null,
  consent_text text not null, created_at timestamptz not null default now(),
  transaction_id text unique
);
create table if not exists public.payment_events (
  event_id text primary key, event_type text not null, occurred_at timestamptz not null,
  processed_at timestamptz not null default now()
);
create table if not exists public.payment_adjustments (
  id text primary key, transaction_id text not null, action text not null,
  status text not null, full_refund boolean not null, occurred_at timestamptz not null,
  original_adjustment_id text
);
create index if not exists payment_adjustments_transaction on public.payment_adjustments(transaction_id);
create table if not exists public.purchase_email_outbox (
  transaction_id text primary key, user_id uuid not null references auth.users(id),
  email text not null, purchased_at timestamptz not null, consent_text text not null,
  sent_at timestamptz, attempts integer not null default 0,
  lease_until timestamptz, lease_token uuid, last_error text
);
alter table public.checkout_intents enable row level security;
alter table public.payment_events enable row level security;
alter table public.payment_adjustments enable row level security;
alter table public.purchase_email_outbox enable row level security;
revoke all on public.checkout_intents, public.payment_events, public.payment_adjustments, public.purchase_email_outbox from anon, authenticated;

create or replace function public.apply_paddle_event(p_event jsonb, p_price_id text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  d jsonb := p_event->'data'; t text := p_event->>'event_type';
  eid text := p_event->>'event_id'; occurred timestamptz := (p_event->>'occurred_at')::timestamptz;
  txn text; intent checkout_intents%rowtype; current_license licenses%rowtype;
  blocked boolean;
begin
  if eid is null or occurred is null then raise exception 'Missing event identity'; end if;
  -- Serialize all events for a transaction, including adjustments delivered before completion.
  txn := case when t = 'transaction.completed' then d->>'id' else d->>'transaction_id' end;
  perform pg_advisory_xact_lock(hashtextextended(coalesce(txn, d->>'id', eid), 0));
  insert into payment_events(event_id,event_type,occurred_at) values(eid,t,occurred) on conflict do nothing;
  if not found then return; end if;
  if t = 'transaction.completed' then
    if p_price_id is null or p_price_id = '' then raise exception 'Price not configured'; end if;
    if not exists(select 1 from jsonb_array_elements(d->'items') item where item->'price'->>'id' = p_price_id) then return; end if;
    if txn is null then raise exception 'Missing transaction'; end if;
    select * into intent from checkout_intents where id = (d->'custom_data'->>'checkout_intent_id')::uuid for update;
    if not found or intent.price_id <> p_price_id then raise exception 'Missing matching checkout intent'; end if;
    if intent.transaction_id is not null and intent.transaction_id <> txn then raise exception 'Checkout intent already consumed'; end if;
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
    update licenses set status=case when blocked then 'canceled' else 'active' end,
      canceled_at=case when blocked then occurred else null end,provider_updated_at=greatest(provider_updated_at,occurred)
    where provider='paddle' and provider_transaction_id=txn;
  elsif t in ('subscription.updated','subscription.activated','subscription.paused','subscription.canceled','subscription.past_due','subscription.resumed') then
    -- Guardian is not sold, but honor lifecycle events for any pre-existing subscription.
    if d->>'status' not in ('active','paused','canceled','past_due') then return; end if;
    update licenses set status=d->>'status',provider_updated_at=occurred
    where provider='paddle' and provider_subscription_id=d->>'id'
      and (provider_updated_at is null or provider_updated_at <= occurred);
  end if;
end $$;
revoke all on function public.apply_paddle_event(jsonb,text) from public, anon, authenticated;
grant execute on function public.apply_paddle_event(jsonb,text) to service_role;

-- Bind a legacy unassigned account-owned pass once, under a row lock. Never bind by email.
create or replace function public.claim_case_pass(p_user_id uuid,p_case_id text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare chosen uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  if exists(select 1 from licenses where user_id=p_user_id and status='active' and plan='appeal_pass' and case_id=p_case_id and (expires_at is null or expires_at>now())) then return true; end if;
  select id into chosen from licenses where user_id=p_user_id and status='active' and plan='appeal_pass' and case_id is null and (expires_at is null or expires_at>now()) order by created_at limit 1 for update;
  if chosen is null then return false; end if;
  update licenses set case_id=p_case_id where id=chosen;
  return true;
end $$;
revoke all on function public.claim_case_pass(uuid,text) from public, anon, authenticated;
grant execute on function public.claim_case_pass(uuid,text) to service_role;

create or replace function public.claim_purchase_emails(p_user_id uuid default null)
returns setof public.purchase_email_outbox language sql security definer set search_path=public,pg_temp as $$
  update purchase_email_outbox set lease_until=now()+interval '2 minutes',lease_token=gen_random_uuid(),attempts=attempts+1
  where transaction_id in (select transaction_id from purchase_email_outbox
    where sent_at is null and (lease_until is null or lease_until<now()) and (p_user_id is null or user_id=p_user_id)
    order by purchased_at limit 10 for update skip locked)
  returning *;
$$;
revoke all on function public.claim_purchase_emails(uuid) from public,anon,authenticated;
grant execute on function public.claim_purchase_emails(uuid) to service_role;
commit;
