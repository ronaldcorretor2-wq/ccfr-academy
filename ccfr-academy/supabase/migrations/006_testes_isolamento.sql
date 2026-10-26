-- CCFR Academy: testes de isolamento entre igrejas e de permissões.
-- 1) Cole tudo no SQL Editor e clique em Run (isso só cria a função de teste).
-- 2) Depois apague o texto, cole  select * from run_isolation_tests();  e clique em Run.
-- Todas as linhas devem mostrar passou = true. O teste cria dados temporários e apaga tudo no final.

create or replace function run_isolation_tests() returns table (teste text, passou boolean) language plpgsql as
$$
declare
  ua uuid := gen_random_uuid(); ub uuid := gen_random_uuid(); uc uuid := gen_random_uuid();
  oa uuid; ob uuid; ca uuid; cb uuid; cd uuid; ma uuid; mb uuid; la uuid; lb uuid; asa uuid; qa uuid;
  n int; ok boolean;
  names text[] := '{}'; oks boolean[] := '{}';
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data) values
    (ua, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teste-isolamento-a@teste.invalid', '', now(), now(), now(), '{}', '{}'),
    (ub, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teste-isolamento-b@teste.invalid', '', now(), now(), now(), '{}', '{}'),
    (uc, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'teste-isolamento-c@teste.invalid', '', now(), now(), now(), '{}', '{}');
  insert into organizations (name, slug) values ('Igreja Teste A', 'teste-iso-a') returning id into oa;
  insert into organizations (name, slug) values ('Igreja Teste B', 'teste-iso-b') returning id into ob;
  insert into organization_members (org_id, user_id, role) values (oa, ua, 'admin'), (oa, uc, 'student'), (ob, ub, 'admin');
  insert into courses (org_id, title, status) values (oa, 'Curso A', 'published') returning id into ca;
  insert into courses (org_id, title, status) values (ob, 'Curso B', 'published') returning id into cb;
  insert into courses (org_id, title, status) values (oa, 'Rascunho A', 'draft') returning id into cd;
  insert into course_modules (org_id, course_id, title) values (oa, ca, 'M A') returning id into ma;
  insert into course_modules (org_id, course_id, title) values (ob, cb, 'M B') returning id into mb;
  insert into lessons (org_id, course_id, module_id, title) values (oa, ca, ma, 'L A') returning id into la;
  insert into lessons (org_id, course_id, module_id, title) values (ob, cb, mb, 'L B') returning id into lb;
  insert into assessments (org_id, course_id, lesson_id) values (oa, ca, la) returning id into asa;
  insert into assessment_questions (org_id, assessment_id, prompt, options) values (oa, asa, 'P?', '["x","y"]'::jsonb) returning id into qa;
  insert into assessment_answers (question_id, org_id, correct_index) values (qa, oa, 0);

  -- Administrador da igreja A
  perform set_config('request.jwt.claims', json_build_object('sub', ua::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', ua::text, true);
  set local role authenticated;
  select count(*) into n from courses;
  names := array_append(names, 'Admin A vê só os cursos da própria igreja'::text); oks := array_append(oks, (n = 2));
  select count(*) into n from courses where id = cb;
  names := array_append(names, 'Admin A não lê curso da igreja B'::text); oks := array_append(oks, (n = 0));
  update courses set title = 'invasao' where id = cb; get diagnostics n = row_count;
  names := array_append(names, 'Admin A não altera curso da igreja B'::text); oks := array_append(oks, (n = 0));
  delete from courses where id = cb; get diagnostics n = row_count;
  names := array_append(names, 'Admin A não exclui curso da igreja B'::text); oks := array_append(oks, (n = 0));
  ok := false;
  begin insert into courses (org_id, title) values (ob, 'invasor'); exception when others then ok := true; end;
  names := array_append(names, 'Admin A não cria curso na igreja B'::text); oks := array_append(oks, ok);
  select count(*) into n from organization_members where org_id = ob;
  names := array_append(names, 'Admin A não vê as pessoas da igreja B'::text); oks := array_append(oks, (n = 0));
  select count(*) into n from lessons where org_id = ob;
  names := array_append(names, 'Admin A não vê aulas da igreja B'::text); oks := array_append(oks, (n = 0));

  -- Aluno da igreja A
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', uc::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', uc::text, true);
  set local role authenticated;
  select count(*) into n from courses where id = ca;
  names := array_append(names, 'Aluno vê curso publicado da própria igreja'::text); oks := array_append(oks, (n = 1));
  select count(*) into n from courses where id = cd;
  names := array_append(names, 'Aluno não vê curso em rascunho'::text); oks := array_append(oks, (n = 0));
  ok := false;
  begin insert into courses (org_id, title) values (oa, 'x'); exception when others then ok := true; end;
  names := array_append(names, 'Aluno não cria curso'::text); oks := array_append(oks, ok);
  update organization_members set role = 'admin' where user_id = uc; get diagnostics n = row_count;
  names := array_append(names, 'Aluno não se promove a administrador'::text); oks := array_append(oks, (n = 0));
  select count(*) into n from assessment_answers;
  names := array_append(names, 'Aluno não vê o gabarito das avaliações'::text); oks := array_append(oks, (n = 0));
  ok := false;
  begin perform create_organization('X', 'teste-iso-x', 'teste-isolamento-a@teste.invalid'); exception when others then ok := true; end;
  names := array_append(names, 'Aluno não cria igreja'::text); oks := array_append(oks, ok);
  select count(*) into n from audit_logs;
  names := array_append(names, 'Aluno não vê o registro de ações'::text); oks := array_append(oks, (n = 0));

  -- Administrador da igreja B
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', ub::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', ub::text, true);
  set local role authenticated;
  select count(*) into n from courses where id = ca;
  names := array_append(names, 'Admin B não lê curso da igreja A'::text); oks := array_append(oks, (n = 0));
  ok := false;
  begin perform submit_attempt(asa, '{}'::jsonb); exception when others then ok := true; end;
  names := array_append(names, 'Admin B não responde avaliação da igreja A'::text); oks := array_append(oks, ok);

  -- Limpeza
  reset role;
  delete from audit_logs where org_id in (oa, ob);
  delete from organizations where slug like 'teste-iso-%';
  delete from auth.users where email like 'teste-isolamento-%@teste.invalid';
  return query select unnest(names), unnest(oks);
end
$$;
revoke all on function run_isolation_tests() from public, anon, authenticated;
