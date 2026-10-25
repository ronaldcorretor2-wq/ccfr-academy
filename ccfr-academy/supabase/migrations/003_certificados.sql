-- CCFR Academy: certificados de conclusão com código verificável.
-- Cole no SQL Editor do Supabase e clique em Run. Rode depois do 001 e do 002.

create table certificates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  code text not null unique,
  student_name text not null,
  course_title text not null,
  org_name text not null,
  issued_at timestamptz not null default now(),
  unique (course_id, user_id)
);
create index on certificates (org_id);

alter table certificates enable row level security;
-- Só leitura: o aluno vê os próprios, a equipe vê os da igreja. Quem emite é a função abaixo.
create policy cert_select on certificates for select using (user_id = auth.uid() or is_staff(org_id));

create function issue_certificate(p_course uuid) returns uuid language plpgsql security definer set search_path = public as
$$
declare
  c courses%rowtype;
  total int;
  n_done int;
  v uuid;
  nm text;
  org text;
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  select * into c from courses where id = p_course;
  if c.id is null or not is_member(c.org_id) or c.status <> 'published' then raise exception 'curso indisponível'; end if;
  select count(*) into total from lessons where course_id = c.id;
  select count(*) into n_done from lesson_progress lp join lessons l on l.id = lp.lesson_id
    where l.course_id = c.id and lp.user_id = auth.uid() and lp.completed;
  if total = 0 or n_done < total then raise exception 'curso não concluído'; end if;
  select id into v from certificates where course_id = c.id and user_id = auth.uid();
  if v is not null then return v; end if;
  select coalesce(nullif(full_name, ''), 'Aluno') into nm from profiles where id = auth.uid();
  if nm is null then nm := 'Aluno'; end if;
  select name into org from organizations where id = c.org_id;
  insert into certificates (org_id, course_id, user_id, code, student_name, course_title, org_name)
    values (c.org_id, c.id, auth.uid(), upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)), nm, c.title, org)
    returning id into v;
  return v;
end
$$;
revoke all on function issue_certificate(uuid) from public, anon;
grant execute on function issue_certificate(uuid) to authenticated;

-- Verificação pública: qualquer pessoa confere um código sem precisar de login (devolve só o necessário)
create function verify_certificate(p_code text) returns jsonb language sql security definer stable set search_path = public as
$$
  select jsonb_build_object('student_name', student_name, 'course_title', course_title, 'org_name', org_name, 'issued_at', issued_at)
  from certificates where code = upper(replace(trim(p_code), '-', '')) limit 1
$$;
grant execute on function verify_certificate(text) to anon, authenticated;
