-- CCFR Academy: logotipo da igreja numa pasta pública (aparece na tela de login) e identidade na entrada.
-- Cole no SQL Editor do Supabase e clique em Run. Pode rodar mais de uma vez. Rode depois do 001 a 010.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 2097152, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists logos_insert on storage.objects;
create policy logos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and is_admin(public.org_of_path(name)));
drop policy if exists logos_delete on storage.objects;
create policy logos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and is_admin(public.org_of_path(name)));

-- Logotipos enviados antes desta versão estavam na pasta privada: precisam ser enviados de novo
update organizations set logo_path = null where logo_path is not null;

-- Nome e logotipo de uma igreja pelo endereço curto (usado na tela de login, sem precisar estar logado)
create or replace function church_branding(p_slug text) returns jsonb language sql security definer stable set search_path = public as
$$ select jsonb_build_object('name', name, 'slug', slug, 'logo_path', logo_path) from organizations where slug = lower(trim(p_slug)) $$;
grant execute on function church_branding(text) to anon, authenticated;
