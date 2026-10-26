-- CCFR Academy: avisos da igreja e catálogo público de cursos (opcional, por igreja).
-- Cole no SQL Editor do Supabase e clique em Run. Pode rodar mais de uma vez. Rode depois do 001 a 007.

alter table organizations add column if not exists public_catalog boolean not null default false;
revoke update on organizations from authenticated;
grant update (name, logo_path, public_catalog) on organizations to authenticated;

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  author_id uuid default auth.uid() references profiles(id) on delete set null,
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '' check (char_length(body) <= 2000),
  created_at timestamptz not null default now()
);
create index if not exists idx_announcements_org on announcements (org_id, created_at desc);
alter table announcements enable row level security;
drop policy if exists ann_select on announcements;
create policy ann_select on announcements for select using (is_member(org_id));
drop policy if exists ann_write on announcements;
create policy ann_write on announcements for all using (is_staff(org_id)) with check (is_staff(org_id));

-- Catálogo público: só devolve algo se a igreja ligou a opção; mostra apenas cursos publicados (título e descrição)
create or replace function public_catalog(p_slug text) returns jsonb language sql security definer stable set search_path = public as
$$
  select jsonb_build_object('name', o.name, 'slug', o.slug,
    'courses', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'title', c.title, 'description', c.description) order by c.created_at)
                         from courses c where c.org_id = o.id and c.status = 'published'), '[]'::jsonb))
  from organizations o where o.slug = lower(trim(p_slug)) and o.public_catalog
$$;
grant execute on function public_catalog(text) to anon, authenticated;
