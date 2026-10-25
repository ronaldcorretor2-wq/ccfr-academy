-- CCFR Academy: avaliações (questionários por aula) com correção automática no banco.
-- Cole no SQL Editor do Supabase e clique em Run. Rode depois do 001_inicial.sql.

create table assessments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  lesson_id uuid not null unique references lessons(id) on delete cascade,
  title text not null default 'Questionário' check (char_length(title) between 1 and 160),
  pass_score int not null default 70 check (pass_score between 1 and 100),
  created_at timestamptz not null default now()
);
create index on assessments (org_id);

create table assessment_questions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  assessment_id uuid not null references assessments(id) on delete cascade,
  prompt text not null check (char_length(prompt) between 1 and 500),
  options jsonb not null check (jsonb_typeof(options) = 'array'),
  position int not null default 1
);
create index on assessment_questions (assessment_id);

-- A resposta certa fica em tabela separada, visível só para a equipe (o aluno nunca recebe o gabarito)
create table assessment_answers (
  question_id uuid primary key references assessment_questions(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  correct_index int not null check (correct_index >= 0)
);

create table assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  assessment_id uuid not null references assessments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  answers jsonb not null,
  score int not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);
create index on assessment_attempts (assessment_id, user_id);

alter table assessments enable row level security;
alter table assessment_questions enable row level security;
alter table assessment_answers enable row level security;
alter table assessment_attempts enable row level security;

create policy as_select on assessments for select using (
  is_member(org_id) and (is_staff(org_id) or exists (select 1 from courses c where c.id = course_id and c.status = 'published')));
create policy as_write on assessments for all using (is_staff(org_id)) with check (
  is_staff(org_id)
  and exists (select 1 from courses c where c.id = course_id and c.org_id = assessments.org_id)
  and exists (select 1 from lessons l where l.id = lesson_id and l.course_id = assessments.course_id));

create policy aq_select on assessment_questions for select using (
  is_member(org_id) and (is_staff(org_id) or exists (
    select 1 from assessments a join courses c on c.id = a.course_id where a.id = assessment_id and c.status = 'published')));
create policy aq_write on assessment_questions for all using (is_staff(org_id)) with check (
  is_staff(org_id) and exists (select 1 from assessments a where a.id = assessment_id and a.org_id = assessment_questions.org_id));

create policy aa_staff on assessment_answers for all using (is_staff(org_id)) with check (
  is_staff(org_id) and exists (select 1 from assessment_questions q where q.id = question_id and q.org_id = assessment_answers.org_id));

-- Tentativas: só leitura pelo próprio aluno ou equipe. Quem grava é a função abaixo.
create policy at_select on assessment_attempts for select using (user_id = auth.uid() or is_staff(org_id));

create function submit_attempt(p_assessment uuid, p_answers jsonb) returns jsonb language plpgsql security definer set search_path = public as
$$
declare
  a assessments%rowtype;
  total int;
  n_ok int := 0;
  res jsonb := '[]'::jsonb;
  q record;
  ans int;
  ok boolean;
  sc int;
  pass boolean;
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  select * into a from assessments where id = p_assessment;
  if a.id is null or not is_member(a.org_id) then raise exception 'avaliação não encontrada'; end if;
  if not (is_staff(a.org_id) or exists (select 1 from courses c where c.id = a.course_id and c.status = 'published')) then
    raise exception 'avaliação indisponível';
  end if;
  select count(*) into total from assessment_questions where assessment_id = a.id;
  if total = 0 then raise exception 'avaliação sem questões'; end if;
  for q in
    select qs.id, k.correct_index
    from assessment_questions qs join assessment_answers k on k.question_id = qs.id
    where qs.assessment_id = a.id order by qs.position, qs.id
  loop
    ans := nullif(p_answers ->> (q.id::text), '')::int;
    ok := (ans is not null and ans = q.correct_index);
    if ok then n_ok := n_ok + 1; end if;
    res := res || jsonb_build_array(jsonb_build_object('question_id', q.id, 'correct', ok));
  end loop;
  sc := round(100.0 * n_ok / total);
  pass := sc >= a.pass_score;
  insert into assessment_attempts (org_id, assessment_id, user_id, answers, score, passed)
    values (a.org_id, a.id, auth.uid(), p_answers, sc, pass);
  return jsonb_build_object('score', sc, 'passed', pass, 'results', res);
end
$$;
revoke all on function submit_attempt(uuid, jsonb) from public, anon;
grant execute on function submit_attempt(uuid, jsonb) to authenticated;
