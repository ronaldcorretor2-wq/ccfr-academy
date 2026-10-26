-- CCFR Academy: envio de arquivos (PDF e áudio) e logotipo da igreja, com isolamento por igreja.
-- Cole no SQL Editor do Supabase e clique em Run. Pode rodar mais de uma vez. Rode depois do 001 a 005.

-- Materiais agora podem ser um arquivo enviado (storage_path) ou um link (url)
alter table lesson_resources alter column url drop not null;
alter table lesson_resources add column if not exists storage_path text;
alter table lesson_resources add column if not exists size_bytes bigint;
alter table lesson_resources drop constraint if exists lesson_resources_url_check;
alter table lesson_resources add constraint lesson_resources_url_check check (url is null or url ~* '^https?://');
alter table lesson_resources drop constraint if exists lesson_resources_origem;
alter table lesson_resources add constraint lesson_resources_origem check (url is not null or storage_path is not null);

-- Logotipo e edição do nome pela própria igreja (plano e limite continuam só no painel mestre)
alter table organizations add column if not exists logo_path text;
revoke update on organizations from authenticated;
grant update (name, logo_path) on organizations to authenticated;
drop policy if exists org_update on organizations;
create policy org_update on organizations for update using (is_admin(id)) with check (is_admin(id));

-- Pasta privada de arquivos. O primeiro nível do caminho é sempre o id da igreja.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('materiais', 'materiais', false, 52428800,
  array['application/pdf','audio/mpeg','audio/mp4','audio/x-m4a','audio/aac','audio/wav','audio/x-wav','audio/ogg','image/png','image/jpeg','image/webp'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create or replace function org_of_path(p text) returns uuid language sql stable set search_path = public as
$$ select case when (storage.foldername(p))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  then ((storage.foldername(p))[1])::uuid end $$;

drop policy if exists mat_select on storage.objects;
create policy mat_select on storage.objects for select to authenticated
  using (bucket_id = 'materiais' and is_member(public.org_of_path(name)));
drop policy if exists mat_insert on storage.objects;
create policy mat_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'materiais' and is_staff(public.org_of_path(name)));
drop policy if exists mat_delete on storage.objects;
create policy mat_delete on storage.objects for delete to authenticated
  using (bucket_id = 'materiais' and is_staff(public.org_of_path(name)));
