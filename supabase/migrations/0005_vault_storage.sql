-- 0005_vault_storage.sql
-- M-6 vault: per-user encrypted-blob sync to Supabase Storage.
-- All blobs are AES-GCM ciphertext produced by the browser (DEK never leaves the device);
-- this migration ONLY constrains who can read/write which paths under the bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'appealdeck-vault',
  'appealdeck-vault',
  false,
  10485760,
  array['application/json']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "vault_owner_select" on storage.objects;
create policy "vault_owner_select"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'appealdeck-vault'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "vault_owner_insert" on storage.objects;
create policy "vault_owner_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'appealdeck-vault'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "vault_owner_update" on storage.objects;
create policy "vault_owner_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'appealdeck-vault'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'appealdeck-vault'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "vault_owner_delete" on storage.objects;
create policy "vault_owner_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'appealdeck-vault'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
