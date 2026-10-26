-- 0024_entitlement_lifecycle.sql — lifecycle and linked-refund checks.
-- Runs inside the migration check transaction; every fixture is rolled back.
do $$
declare uid uuid; iid uuid; ev jsonb; n integer;
begin
  select id into uid from auth.users order by created_at limit 1;
  if uid is null then raise exception 'Regression test requires an existing auth user'; end if;

  -- 1. A lapsed Account Pass no longer blocks the purchase that replaces it, and stays as history.
  insert into licenses(license_key, email, user_id, plan, status, provider, provider_transaction_id,
                       activated_at, provider_updated_at, expires_at)
  values('AD-REGRESSION-LAPSED', 'regression@example.invalid', uid, 'account_pass', 'active', 'paddle',
         'txn_regressionlapsed', now() - interval '14 months', now() - interval '14 months',
         now() - interval '2 months');
  insert into checkout_intents(user_id, case_id, email, price_id, consent_text)
  values(uid, 'account', 'regression@example.invalid', 'pri_regressionaccount', 'test consent')
  returning id into iid;
  ev := jsonb_build_object('event_id', 'evt_regressionreplacement', 'event_type', 'transaction.completed',
    'occurred_at', now(),
    'data', jsonb_build_object('id', 'txn_regressionreplacement',
      'items', jsonb_build_array(jsonb_build_object('price', jsonb_build_object('id', 'pri_regressionaccount'))),
      'custom_data', jsonb_build_object('checkout_intent_id', iid)));
  perform apply_paddle_event(ev, 'pri_regressionmain', 'pri_regressionaccount');
  select count(*) into n from licenses
    where provider_transaction_id = 'txn_regressionlapsed' and status = 'expired';
  if n <> 1 then raise exception 'A lapsed Account Pass was not retired by its replacement'; end if;
  select count(*) into n from licenses
    where provider_transaction_id = 'txn_regressionreplacement' and status = 'active' and plan = 'account_pass';
  if n <> 1 then raise exception 'The replacement Account Pass was not granted'; end if;
  -- A renewal may follow a row that has already ended, not only one still running. With the
  -- replacement refunded, the retired row is the only cover history left.
  perform apply_paddle_event(jsonb_build_object('event_id', 'evt_regressionreplacementrefund',
    'event_type', 'adjustment.created', 'occurred_at', now() + interval '1 minute',
    'data', jsonb_build_object('id', 'adj_regressionreplacementrefund',
      'transaction_id', 'txn_regressionreplacement', 'action', 'refund', 'status', 'approved',
      'type', 'full')), 'pri_regressionmain');
  insert into checkout_intents(user_id, case_id, email, price_id, consent_text)
  values(uid, 'account', 'regression@example.invalid', 'pri_regressionrenewal', 'test consent')
  returning id into iid;
  ev := jsonb_build_object('event_id', 'evt_regressionrenewal', 'event_type', 'transaction.completed',
    'occurred_at', now(),
    'data', jsonb_build_object('id', 'txn_regressionrenewal',
      'items', jsonb_build_array(jsonb_build_object('price', jsonb_build_object('id', 'pri_regressionrenewal'))),
      'custom_data', jsonb_build_object('checkout_intent_id', iid)));
  perform apply_paddle_event(ev, 'pri_regressionmain', null,
    jsonb_build_object('account_renewal', 'pri_regressionrenewal'));
  select count(*) into n from licenses
    where provider_transaction_id = 'txn_regressionrenewal' and plan = 'account_renewal' and status = 'active'
      and expires_at > now() + interval '11 months';
  if n <> 1 then raise exception 'A renewal could not follow an ended Account Pass'; end if;

  -- 2. A credited upgrade belongs to the purchase it was discounted against.
  insert into licenses(license_key, email, user_id, case_id, plan, status, provider, provider_transaction_id,
                       activated_at, provider_updated_at)
  values('AD-REGRESSION-REVIEW', 'regression@example.invalid', uid, 'linked-case', 'document_review',
         'active', 'paddle', 'txn_regressionreview', now(), now());
  insert into checkout_intents(user_id, case_id, email, price_id, consent_text)
  values(uid, 'linked-case', 'regression@example.invalid', 'pri_regressionupgrade', 'test consent')
  returning id into iid;
  ev := jsonb_build_object('event_id', 'evt_regressionupgrade', 'event_type', 'transaction.completed',
    'occurred_at', now(),
    'data', jsonb_build_object('id', 'txn_regressionupgrade',
      'items', jsonb_build_array(jsonb_build_object('price', jsonb_build_object('id', 'pri_regressionupgrade'))),
      'custom_data', jsonb_build_object('checkout_intent_id', iid)));
  perform apply_paddle_event(ev, 'pri_regressionmain', null,
    jsonb_build_object('pass_after_review', 'pri_regressionupgrade'));
  select count(*) into n from licenses
    where provider_transaction_id = 'txn_regressionupgrade' and plan = 'appeal_pass'
      and credit_transaction_id = 'txn_regressionreview' and status = 'active';
  if n <> 1 then raise exception 'The credited upgrade is not linked to its purchase'; end if;

  -- a. Refunding the original cancels the upgrade with it.
  perform apply_paddle_event(jsonb_build_object('event_id', 'evt_regressionbaserefund',
    'event_type', 'adjustment.created', 'occurred_at', now() + interval '1 minute',
    'data', jsonb_build_object('id', 'adj_regressionbaserefund', 'transaction_id', 'txn_regressionreview',
      'action', 'refund', 'status', 'approved', 'type', 'full')), 'pri_regressionmain');
  if exists(select 1 from licenses where provider_transaction_id = 'txn_regressionreview' and status = 'active')
     or exists(select 1 from licenses where provider_transaction_id = 'txn_regressionupgrade' and status = 'active') then
    raise exception 'A refund of the original left the credited upgrade active';
  end if;
  -- The upgrade's own payment is now owed back; the original is already refunded by Paddle.
  select count(*) into n from licenses
    where provider_transaction_id = 'txn_regressionupgrade' and refund_owed_at is not null;
  if n <> 1 then raise exception 'A refund of the original did not mark the upgrade payment as owed'; end if;
  select count(*) into n from licenses
    where provider_transaction_id = 'txn_regressionreview' and refund_owed_at is not null;
  if n <> 0 then raise exception 'The original was marked as owing a refund Paddle already paid'; end if;

  -- c. Reversing it restores both, each still cancellable on its own.
  perform apply_paddle_event(jsonb_build_object('event_id', 'evt_regressionbasereverse',
    'event_type', 'adjustment.created', 'occurred_at', now() + interval '2 minutes',
    'data', jsonb_build_object('id', 'adj_regressionbasereverse', 'transaction_id', 'txn_regressionreview',
      'action', 'chargeback_reverse', 'status', 'approved', 'type', 'full',
      'original_adjustment_id', 'adj_regressionbaserefund')), 'pri_regressionmain');
  select count(*) into n from licenses
    where provider_transaction_id in ('txn_regressionreview', 'txn_regressionupgrade') and status = 'active';
  if n <> 2 then raise exception 'Reversing the original did not restore the linked upgrade'; end if;
  -- Restoring the upgrade withdraws the debt it carried.
  select count(*) into n from licenses
    where provider_transaction_id = 'txn_regressionupgrade' and refund_owed_at is not null;
  if n <> 0 then raise exception 'A reversal left a refund owed for the restored upgrade'; end if;

  -- b. Refunding only the upgrade leaves the original in place.
  perform apply_paddle_event(jsonb_build_object('event_id', 'evt_regressionupgraderefund',
    'event_type', 'adjustment.created', 'occurred_at', now() + interval '3 minutes',
    'data', jsonb_build_object('id', 'adj_regressionupgraderefund', 'transaction_id', 'txn_regressionupgrade',
      'action', 'refund', 'status', 'approved', 'type', 'full')), 'pri_regressionmain');
  if not exists(select 1 from licenses where provider_transaction_id = 'txn_regressionreview' and status = 'active') then
    raise exception 'Refunding only the upgrade cancelled its original';
  end if;
  if exists(select 1 from licenses where provider_transaction_id = 'txn_regressionupgrade' and status = 'active') then
    raise exception 'The refunded upgrade is still active';
  end if;
end $$;
