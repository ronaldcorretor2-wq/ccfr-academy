-- CCFR Academy: anotações, favoritos, materiais complementares e trilhas de formação.
-- Cole no SQL Editor do Supabase e clique em Run. Rode depois do 001, 002 e 003.

create table lesson_notes (
  org_id uuid not null references organizations(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null default '' check (char_length(content) <= 5000),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create table favorites (
  org_id uuid not null references organizations(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);
create table lesson_resources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  url text not null check (url ~* '^https?://'),
  kind text not null default 'link' check (kind in ('link','pdf','audio','outro')),
  position int not null default 1
);
create index on lesson_resources (lesson_id);
create table learning_paths (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  description text not null default '',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now()
);
create table learning_path_courses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  path_id uuid not null references learning_paths(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  position int not null default 1,
  unique (path_id, course_id)
);
create index on learning_path_courses (path_id);

alter table lesson_notes enable row level security;
alter table favorites enable row level security;
alter table lesson_resources enable row level security;
alter table learning_paths enable row level security;
alter table learning_path_courses enable row level security;

create policy notes_own on lesson_notes for all using (user_id = auth.uid()) with check (
  user_id = auth.uid() and is_member(org_id)
  and exists (select 1 from lessons l where l.id = lesson_id and l.org_id = lesson_notes.org_id));
create policy fav_own on favorites for all using (user_id = auth.uid()) with check (
  user_id = auth.uid() and is_member(org_id)
  and exists (select 1 from courses c where c.id = course_id and c.org_id = favorites.org_id));

create policy res_select on lesson_resources for select using (
  is_member(org_id) and (is_staff(org_id) or exists (select 1 from courses c where c.id = course_id and c.status = 'published')));
create policy res_write on lesson_resources for all using (is_staff(org_id)) with check (
  is_staff(org_id) and exists (select 1 from lessons l where l.id = lesson_id and l.org_id = lesson_resources.org_id and l.course_id = lesson_resources.course_id));

create policy path_select on learning_paths for select using (is_member(org_id) and (is_staff(org_id) or status = 'published'));
create policy path_write on learning_paths for all using (is_staff(org_id)) with check (is_staff(org_id));

create policy pc_select on learning_path_courses for select using (
  is_member(org_id) and (is_staff(org_id) or exists (select 1 from learning_paths p where p.id = path_id and p.status = 'published')));
create policy pc_write on learning_path_courses for all using (is_staff(org_id)) with check (
  is_staff(org_id)
  and exists (select 1 from learning_paths p where p.id = path_id and p.org_id = learning_path_courses.org_id)
  and exists (select 1 from courses c where c.id = course_id and c.org_id = learning_path_courses.org_id));
