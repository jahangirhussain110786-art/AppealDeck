do $$
declare lid uuid; i integer;
begin
 insert into public.licenses(email,status,plan,provider,license_key) values ('device-cap-test@example.invalid','active','appeal_pass','regression','DEVICE-CAP-REGRESSION') returning id into lid;
 for i in 1..5 loop
   insert into public.license_devices(license_id,device_fingerprint) values(lid, 'regression-' || i);
 end loop;
 begin
   insert into public.license_devices(license_id,device_fingerprint) values(lid, 'regression-6');
   raise exception 'Sixth device unexpectedly accepted';
 exception when check_violation then null;
 end;
 insert into public.license_devices(license_id,device_fingerprint,revoked_at) values(lid,'regression-revoked',now());
 begin
   update public.license_devices set revoked_at=null where license_id=lid and device_fingerprint='regression-revoked';
   raise exception 'Revoked device bypassed cap';
 exception when check_violation then null;
 end;
 update public.license_devices set revoked_at=now() where license_id=lid and device_fingerprint='regression-1';
 update public.license_devices set revoked_at=null where license_id=lid and device_fingerprint='regression-revoked';
 if (select count(*) from public.license_devices where license_id=lid and revoked_at is null) <> 5 then raise exception 'Unexpected device count'; end if;
end $$;
