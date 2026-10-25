-- CCFR Academy: esquema inicial (multi-igreja, com RLS). Cole no SQL Editor do Supabase e clique em Run.

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table organization_members (
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('admin','teacher','student')),
  joined_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index on organization_members (user_id);

create table courses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  description text not null default '',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now()
);
create index on courses (org_id);

create table course_modules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  position int not null default 1
);
create index on course_modules (course_id);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  module_id uuid not null references course_modules(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  video_url text,
  content text not null default '',
  position int not null default 1
);
create index on lessons (course_id);
create index on lessons (module_id);

create table enrollments (
  org_id uuid not null references organizations(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (course_id, user_id)
);
create index on enrollments (org_id);

create table lesson_progress (
  org_id uuid not null references organizations(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  completed boolean not null default false,
  position_seconds int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create index on lesson_progress (org_id);

-- Funções de apoio (o papel vem SEMPRE do banco, nunca do navegador)
create function is_member(o uuid) returns boolean language sql security definer stable set search_path = public as
$$ select exists (select 1 from organization_members where org_id = o and user_id = auth.uid()) $$;
create function is_staff(o uuid) returns boolean language sql security definer stable set search_path = public as
$$ select exists (select 1 from organization_members where org_id = o and user_id = auth.uid() and role in ('admin','teacher')) $$;
create function is_admin(o uuid) returns boolean language sql security definer stable set search_path = public as
$$ select exists (select 1 from organization_members where org_id = o and user_id = auth.uid() and role = 'admin') $$;

-- Cria o perfil quando alguém se cadastra
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as
$$ begin
  insert into profiles (id, full_name) values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Criar igreja (quem cria vira administrador) e entrar numa igreja como aluno
create function create_organization(p_name text, p_slug text) returns uuid language plpgsql security definer set search_path = public as
$$ declare v uuid; begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  insert into organizations (name, slug) values (trim(p_name), lower(trim(p_slug))) returning id into v;
  insert into organization_members (org_id, user_id, role) values (v, auth.uid(), 'admin');
  return v;
end $$;
create function join_organization(p_slug text) returns uuid language plpgsql security definer set search_path = public as
$$ declare v uuid; begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  select id into v from organizations where slug = lower(trim(p_slug));
  if v is null then raise exception 'igreja não encontrada'; end if;
  insert into organization_members (org_id, user_id, role) values (v, auth.uid(), 'student') on conflict do nothing;
  return v;
end $$;
revoke all on function create_organization(text, text), join_organization(text) from public, anon;
grant execute on function create_organization(text, text), join_organization(text) to authenticated;

-- RLS
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table organization_members enable row level security;
alter table courses enable row level security;
alter table course_modules enable row level security;
alter table lessons enable row level security;
alter table enrollments enable row level security;
alter table lesson_progress enable row level security;

create policy org_select on organizations for select using (is_member(id));

create policy prof_select on profiles for select using (
  id = auth.uid() or exists (
    select 1 from organization_members a join organization_members b on a.org_id = b.org_id
    where a.user_id = auth.uid() and b.user_id = profiles.id));
create policy prof_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy mem_select on organization_members for select using (user_id = auth.uid() or is_admin(org_id));
create policy mem_update on organization_members for update using (is_admin(org_id)) with check (is_admin(org_id));
create policy mem_delete on organization_members for delete using (is_admin(org_id));

create policy course_select on courses for select using (is_member(org_id) and (status = 'published' or is_staff(org_id)));
create policy course_write on courses for all using (is_staff(org_id)) with check (is_staff(org_id));

create policy mod_select on course_modules for select using (
  is_member(org_id) and (is_staff(org_id) or exists (select 1 from courses c where c.id = course_id and c.status = 'published')));
create policy mod_write on course_modules for all using (is_staff(org_id)) with check (
  is_staff(org_id) and exists (select 1 from courses c where c.id = course_id and c.org_id = course_modules.org_id));

create policy les_select on lessons for select using (
  is_member(org_id) and (is_staff(org_id) or exists (select 1 from courses c where c.id = course_id and c.status = 'published')));
create policy les_write on lessons for all using (is_staff(org_id)) with check (
  is_staff(org_id)
  and exists (select 1 from courses c where c.id = course_id and c.org_id = lessons.org_id)
  and exists (select 1 from course_modules m where m.id = module_id and m.course_id = lessons.course_id));

create policy enr_select on enrollments for select using (user_id = auth.uid() or is_staff(org_id));
create policy enr_insert on enrollments for insert with check (
  user_id = auth.uid() and is_member(org_id)
  and exists (select 1 from courses c where c.id = course_id and c.org_id = enrollments.org_id and c.status = 'published'));
create policy enr_delete on enrollments for delete using (user_id = auth.uid());

create policy prog_select on lesson_progress for select using (user_id = auth.uid() or is_staff(org_id));
create policy prog_insert on lesson_progress for insert with check (
  user_id = auth.uid() and is_member(org_id)
  and exists (select 1 from lessons l where l.id = lesson_id and l.org_id = lesson_progress.org_id));
create policy prog_update on lesson_progress for update using (user_id = auth.uid()) with check (
  user_id = auth.uid() and is_member(org_id)
  and exists (select 1 from lessons l where l.id = lesson_id and l.org_id = lesson_progress.org_id));
