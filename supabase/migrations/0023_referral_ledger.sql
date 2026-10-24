begin;

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete restrict,
  code text not null unique check (code ~ '^[A-Z0-9]{3,32}$'),
  discount_id text not null unique check (discount_id ~ '^dsc_[a-z0-9]+$'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.checkout_intents add column referral_code_id uuid references public.referral_codes(id);

create table public.growth_transactions (
  transaction_id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  currency text not null,
  revenue_cents bigint,
  fee_cents bigint,
  paid_at timestamptz not null,
  check (revenue_cents is null or revenue_cents >= 0),
  check (fee_cents is null or fee_cents >= 0)
);
create table public.growth_adjustments (
  id text primary key,
  transaction_id text not null,
  action text not null,
  status text not null,
  currency text not null,
  original_adjustment_id text,
  full_refund boolean not null default false,
  revenue_cents bigint,
  occurred_at timestamptz not null
);
create index growth_adjustments_transaction on public.growth_adjustments(transaction_id);
create table public.referral_sales (
  transaction_id text primary key references public.growth_transactions(transaction_id),
  partner_id uuid not null references public.partners(id),
  code_id uuid not null references public.referral_codes(id),
  rate_bps integer not null default 3000 check (rate_bps between 0 and 10000),
  eligible_at timestamptz not null,
  review_required boolean not null default false
);
create table public.referral_payouts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id),
  currency text not null check (currency = 'USD'),
  amount_cents bigint not null check (amount_cents > 0),
  reference text not null unique,
  paid_at timestamptz not null default now()
);

alter table public.partners enable row level security;
alter table public.referral_codes enable row level security;
alter table public.growth_transactions enable row level security;
alter table public.growth_adjustments enable row level security;
alter table public.referral_sales enable row level security;
alter table public.referral_payouts enable row level security;
revoke all on public.partners, public.referral_codes, public.growth_transactions,
  public.growth_adjustments, public.referral_sales, public.referral_payouts from anon, authenticated;
grant all on public.partners, public.referral_codes, public.growth_transactions,
  public.growth_adjustments, public.referral_sales, public.referral_payouts to service_role;

create function public.growth_net_revenue(p_transaction text)
returns bigint language sql stable security definer set search_path = public, pg_temp as $$
  select case when exists(
    select 1 from growth_adjustments a where a.transaction_id = g.transaction_id
      and a.status = 'approved' and a.action in ('chargeback_reverse','chargeback_warning_reverse','credit_reverse')
      and (a.original_adjustment_id is null or not exists(
        select 1 from growth_adjustments original where original.id = a.original_adjustment_id
          and original.transaction_id = g.transaction_id))
  ) then null when exists(
    select 1 from growth_adjustments a where a.transaction_id = g.transaction_id
      and a.status = 'approved' and (a.full_refund or a.action = 'chargeback')
      and not exists(select 1 from growth_adjustments r where r.original_adjustment_id = a.id
        and r.transaction_id = a.transaction_id and r.action in ('chargeback_reverse','chargeback_warning_reverse') and r.status = 'approved')
  ) then 0 when g.revenue_cents is null or exists(
    select 1 from growth_adjustments a where a.transaction_id = g.transaction_id
      and a.status in ('approved', 'pending_approval')
      and a.action in ('refund', 'chargeback', 'chargeback_warning')
      and (a.revenue_cents is null or a.status = 'pending_approval' or a.currency <> g.currency)
      and not exists(select 1 from growth_adjustments r where r.original_adjustment_id = a.id
        and r.transaction_id = a.transaction_id and r.action in ('chargeback_reverse','chargeback_warning_reverse') and r.status = 'approved')
  ) then null else greatest(0, g.revenue_cents - coalesce((
    select sum(a.revenue_cents) from growth_adjustments a where a.transaction_id = g.transaction_id
      and a.status = 'approved' and a.action in ('refund', 'chargeback', 'chargeback_warning')
      and not exists(select 1 from growth_adjustments r where r.original_adjustment_id = a.id
        and r.transaction_id = a.transaction_id and r.action in ('chargeback_reverse','chargeback_warning_reverse') and r.status = 'approved')
  ),0))::bigint end from growth_transactions g where g.transaction_id = p_transaction;
$$;

create view public.referral_balances as
  select s.transaction_id, s.partner_id, g.currency, s.eligible_at,
    s.review_required or g.currency <> 'USD' or growth_net_revenue(s.transaction_id) is null as held,
    floor(coalesce(growth_net_revenue(s.transaction_id),0)::numeric * s.rate_bps / 10000)::bigint as commission_cents
  from referral_sales s join growth_transactions g using(transaction_id);
revoke all on public.referral_balances from anon, authenticated;
grant select on public.referral_balances to service_role;

create view public.growth_transaction_report as
  select g.transaction_id,g.user_id,g.currency,g.fee_cents,g.paid_at,
    growth_net_revenue(g.transaction_id) as net_cents from growth_transactions g;
revoke all on public.growth_transaction_report from anon,authenticated;
grant select on public.growth_transaction_report to service_role;

alter function public.apply_paddle_event(jsonb,text,text,jsonb) rename to apply_paddle_event_before_referrals;
create function public.apply_paddle_event(
  p_event jsonb, p_price_id text, p_account_price_id text default null, p_extra_prices jsonb default '{}'::jsonb
)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  result text; d jsonb := p_event->'data'; t text := p_event->>'event_type';
  txn text; intent checkout_intents%rowtype; code referral_codes%rowtype;
  partner partners%rowtype; totals jsonb; revenue bigint; fee bigint;
begin
  result := apply_paddle_event_before_referrals(p_event,p_price_id,p_account_price_id,p_extra_prices);
  if result <> 'ok' then return result; end if;
  if t = 'transaction.completed' then
    txn := d->>'id'; totals := d->'details'->'totals';
    if totals->>'total' ~ '^[0-9]{1,12}$' and totals->>'tax' ~ '^[0-9]{1,12}$'
      and (totals->>'total')::bigint >= (totals->>'tax')::bigint then
      revenue := greatest(0,(totals->>'total')::bigint - (totals->>'tax')::bigint);
    end if;
    if totals->>'fee' ~ '^[0-9]{1,12}$' then fee := (totals->>'fee')::bigint; end if;
    select * into intent from checkout_intents where transaction_id = txn limit 1;
    insert into growth_transactions(transaction_id,user_id,currency,revenue_cents,fee_cents,paid_at)
      values(txn,coalesce(intent.user_id,(select user_id from licenses where provider_subscription_id = d->>'subscription_id' limit 1)),
        coalesce(d->>'currency_code','UNKNOWN'),revenue,fee,(p_event->>'occurred_at')::timestamptz)
      on conflict do nothing;
    if intent.referral_code_id is null then return result; end if;
    select * into code from referral_codes where id = intent.referral_code_id;
    select * into partner from partners where id = code.partner_id;
    if partner.user_id = intent.user_id or d->>'discount_id' is distinct from code.discount_id
       or intent.price_id not in (p_price_id,coalesce(p_account_price_id,'')) then return result; end if;
    insert into referral_sales(transaction_id,partner_id,code_id,eligible_at,review_required)
      values(txn,partner.id,code.id,(p_event->>'occurred_at')::timestamptz + interval '14 days',
        not code.active or not partner.active)
      on conflict do nothing;
  elsif t in ('adjustment.created','adjustment.updated') then
    totals := d->'totals';
    if totals->>'subtotal' ~ '^[0-9]{1,12}$' then revenue := (totals->>'subtotal')::bigint; end if;
    insert into growth_adjustments(id,transaction_id,action,status,currency,original_adjustment_id,full_refund,revenue_cents,occurred_at)
      values(d->>'id',d->>'transaction_id',d->>'action',d->>'status',coalesce(d->>'currency_code','UNKNOWN'),d->>'original_adjustment_id',
        d->>'action' = 'refund' and coalesce(d->>'type','') = 'full',revenue,(p_event->>'occurred_at')::timestamptz)
      on conflict(id) do update set status = excluded.status, revenue_cents = excluded.revenue_cents, currency = excluded.currency,
        occurred_at = excluded.occurred_at
      where growth_adjustments.occurred_at <= excluded.occurred_at;
  end if;
  return result;
end $$;

revoke all on function public.growth_net_revenue(text) from public,anon,authenticated;
grant execute on function public.growth_net_revenue(text) to service_role;
revoke all on function public.apply_paddle_event(jsonb,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.apply_paddle_event(jsonb,text,text,jsonb) to service_role;
revoke all on function public.apply_paddle_event_before_referrals(jsonb,text,text,jsonb) from public,anon,authenticated,service_role;

create function public.partner_statement(p_user_id uuid)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'active',p.active,
    'codes',coalesce((select jsonb_agg(jsonb_build_object('code',c.code,'active',c.active))
      from referral_codes c where c.partner_id = p.id),'[]'::jsonb),
    'pending',coalesce((select sum(b.commission_cents) from referral_balances b
      where b.partner_id = p.id and not b.held and b.eligible_at > now()),0),
    'earned',coalesce((select sum(b.commission_cents) from referral_balances b
      where b.partner_id = p.id and not b.held and b.eligible_at <= now()),0),
    'paid',coalesce((select sum(r.amount_cents) from referral_payouts r where r.partner_id = p.id),0),
    'held',(select count(*) from referral_balances b where b.partner_id = p.id and b.held)
  ) from partners p where p.user_id = p_user_id;
$$;
revoke all on function public.partner_statement(uuid) from public,anon,authenticated;
grant execute on function public.partner_statement(uuid) to service_role;
commit;
