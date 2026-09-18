-- Runs inside the migration check transaction; every fixture is rolled back.
do $$
declare uid uuid; iid uuid; iid2 uuid; ev jsonb; n integer;
begin
  select id into uid from auth.users order by created_at limit 1;
  if uid is null then raise exception 'Regression test requires an existing auth user'; end if;
  if has_table_privilege('authenticated','public.licenses','UPDATE') then raise exception 'Clients can still update licenses'; end if;
  if has_function_privilege('authenticated','public.claim_case_pass(uuid,text)','EXECUTE') then raise exception 'Client can claim another user pass'; end if;
  insert into checkout_intents(user_id,case_id,email,price_id,consent_text) values(uid,'regression-case','regression@example.invalid','pri_regression','test consent') returning id into iid;
  ev := jsonb_build_object('event_id','evt_regressioncomplete','event_type','transaction.completed','occurred_at',now(),
    'data',jsonb_build_object('id','txn_regression','items',jsonb_build_array(jsonb_build_object('price',jsonb_build_object('id','pri_regression'))),'custom_data',jsonb_build_object('checkout_intent_id',iid)));
  perform apply_paddle_event(ev,'pri_regression');
  perform apply_paddle_event(ev,'pri_regression');
  select count(*) into n from licenses where provider_transaction_id='txn_regression';
  if n<>1 then raise exception 'Duplicate license'; end if;
  if not claim_case_pass(uid,'regression-case') then raise exception 'Purchased case denied'; end if;
  -- Fresh user without unbound legacy passes for exact case isolation test.
  if exists(select 1 from licenses where provider_transaction_id='txn_regression' and case_id<>'regression-case') then raise exception 'Wrong case'; end if;
  perform apply_paddle_event(jsonb_build_object('event_id','evt_regressionrefund','event_type','adjustment.updated','occurred_at',now()+interval '1 minute',
    'data',jsonb_build_object('id','adj_regression','transaction_id','txn_regression','action','refund','status','approved','type','full')),'pri_regression');
  if exists(select 1 from licenses where provider_transaction_id='txn_regression' and status='active') then raise exception 'Refund not revoked'; end if;
  perform apply_paddle_event(jsonb_set(ev,'{event_id}','"evt_regressionlate"'),'pri_regression');
  if exists(select 1 from licenses where provider_transaction_id='txn_regression' and status='active') then raise exception 'Late purchase reactivated refund'; end if;
  insert into checkout_intents(user_id,case_id,email,price_id,consent_text) values(uid,'regression-case-two','regression@example.invalid','pri_regression','test consent') returning id into iid2;
  perform apply_paddle_event(jsonb_build_object('event_id','evt_regressionearlyrefund','event_type','adjustment.created','occurred_at',now(),
    'data',jsonb_build_object('id','adj_regressionearly','transaction_id','txn_regressiontwo','action','chargeback','status','approved','type','full')),'pri_regression');
  ev := jsonb_set(jsonb_set(jsonb_set(ev,'{event_id}','"evt_regressiontwo"'),'{data,id}','"txn_regressiontwo"'),'{data,custom_data,checkout_intent_id}',to_jsonb(iid2));
  perform apply_paddle_event(ev,'pri_regression');
  if exists(select 1 from licenses where provider_transaction_id='txn_regressiontwo' and status='active') then raise exception 'Early chargeback ignored'; end if;
  begin
    ev := jsonb_set(jsonb_set(ev,'{event_id}','"evt_regressioninvalid"'),'{data,custom_data,checkout_intent_id}',to_jsonb(gen_random_uuid()));
    perform apply_paddle_event(ev,'pri_regression');
    raise exception 'Expected intent rejection' using errcode='P0002';
  exception when raise_exception then null;
  end;
  if exists(select 1 from payment_events where event_id='evt_regressioninvalid') then raise exception 'Failed event was acknowledged'; end if;
end $$;
