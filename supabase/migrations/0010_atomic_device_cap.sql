begin;
create or replace function public.enforce_device_cap() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.revoked_at is not null then return new; end if;
  if TG_OP = 'UPDATE' then
    if old.revoked_at is null and old.license_id = new.license_id then return new; end if;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('device:' || new.license_id::text, 0));
  if (select count(*) from public.license_devices where license_id = new.license_id and revoked_at is null and id <> new.id) >= 5 then
    raise exception 'Device cap reached' using errcode = '23514';
  end if;
  return new;
end;
$$;
drop trigger if exists enforce_device_cap on public.license_devices;
create trigger enforce_device_cap before insert or update on public.license_devices for each row execute function public.enforce_device_cap();
revoke all on function public.enforce_device_cap() from public, anon, authenticated;
commit;
