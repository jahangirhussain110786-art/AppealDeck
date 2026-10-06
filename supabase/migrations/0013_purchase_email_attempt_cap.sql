-- A purchase email to an address that keeps bouncing was retried at every daily cron and every
-- confirmation request, forever. Stop claiming a row after five attempts; it stays unsent and can be
-- found with: select * from purchase_email_outbox where sent_at is null and attempts >= 5;
create or replace function public.claim_purchase_emails(p_user_id uuid default null)
returns setof public.purchase_email_outbox language sql security definer set search_path=public,pg_temp as $$
  update purchase_email_outbox set lease_until=now()+interval '2 minutes',lease_token=gen_random_uuid(),attempts=attempts+1
  where transaction_id in (select transaction_id from purchase_email_outbox
    where sent_at is null and attempts < 5 and user_id is not null and (lease_until is null or lease_until<now()) and (p_user_id is null or user_id=p_user_id)
    order by purchased_at limit 10 for update skip locked)
  returning *;
$$;
revoke all on function public.claim_purchase_emails(uuid) from public,anon,authenticated;
grant execute on function public.claim_purchase_emails(uuid) to service_role;
