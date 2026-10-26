-- CCFR Academy: segurança, painel mestre, limites e registro de ações (auditoria).
-- Cole no SQL Editor do Supabase e clique em Run. Rode depois do 001 a 004.

-- 1) Administradores da plataforma (o "painel mestre"), separados dos administradores de cada igreja
create table platform_admins (user_id uuid primary key references profiles(id) on delete cascade);
alter table platform_admins enable row level security;
create policy pa_self on platform_admins for select using (user_id = auth.uid());
create function is_platform_admin() returns boolean language sql security definer stable set search_path = public as
$$ select exists (select 1 from platform_admins where user_id = auth.uid()) $$;
grant execute on function is_platform_admin() to authenticated;

-- 2) Plano e limites por igreja
alter table organizations add column plan text not null default 'teste';
alter table organizations add column max_students int not null default 100 check (max_students >= 0);

-- 3) E-mail no perfil (visível só para quem já vê o perfil: a própria pessoa e os administradores da igreja)
alter table profiles add column email text;
update profiles p set email = u.email from auth.users u where u.id = p.id;
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as
$$ begin
  insert into profiles (id, full_name, email) values (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  return new;
end $$;
-- A pessoa só pode editar o próprio nome (não o e-mail nem outros campos)
revoke update on profiles from authenticated;
grant update (full_name) on profiles to authenticated;

-- 4) Só o painel mestre cria igrejas
drop function create_organization(text, text);
create function create_organization(p_name text, p_slug text, p_admin_email text) returns uuid language plpgsql security definer set search_path = public as
$$ declare v uuid; u uuid; begin
  if not is_platform_admin() then raise exception 'sem permissão'; end if;
  select id into u from auth.users where lower(email) = lower(trim(p_admin_email));
  if u is null then raise exception 'administrador não encontrado: ele precisa criar a conta primeiro'; end if;
  insert into organizations (name, slug) values (trim(p_name), lower(trim(p_slug))) returning id into v;
  insert into organization_members (org_id, user_id, role) values (v, u, 'admin');
  return v;
end $$;
revoke all on function create_organization(text, text, text) from public, anon;
grant execute on function create_organization(text, text, text) to authenticated;

create function master_set_admin(p_org uuid, p_email text) returns void language plpgsql security definer set search_path = public as
$$ declare u uuid; begin
  if not is_platform_admin() then raise exception 'sem permissão'; end if;
  select id into u from auth.users where lower(email) = lower(trim(p_email));
  if u is null then raise exception 'usuário não encontrado'; end if;
  insert into organization_members (org_id, user_id, role) values (p_org, u, 'admin')
    on conflict (org_id, user_id) do update set role = 'admin';
end $$;
revoke all on function master_set_admin(uuid, text) from public, anon;
grant execute on function master_set_admin(uuid, text) to authenticated;

create function master_update_org(p_org uuid, p_plan text, p_max int) returns void language plpgsql security definer set search_path = public as
$$ begin
  if not is_platform_admin() then raise exception 'sem permissão'; end if;
  update organizations set plan = trim(p_plan), max_students = greatest(p_max, 0) where id = p_org;
end $$;
revoke all on function master_update_org(uuid, text, int) from public, anon;
grant execute on function master_update_org(uuid, text, int) to authenticated;

create function master_list_orgs() returns table (id uuid, name text, slug text, plan text, max_students int, created_at timestamptz, members bigint, students bigint, courses bigint)
language sql security definer stable set search_path = public as
$$
  select o.id, o.name, o.slug, o.plan, o.max_students, o.created_at,
    (select count(*) from organization_members m where m.org_id = o.id),
    (select count(*) from organization_members m where m.org_id = o.id and m.role = 'student'),
    (select count(*) from courses c where c.org_id = o.id)
  from organizations o where is_platform_admin() order by o.created_at
$$;
revoke all on function master_list_orgs() from public, anon;
grant execute on function master_list_orgs() to authenticated;

-- 5) Limite de alunos na entrada
create or replace function join_organization(p_slug text) returns uuid language plpgsql security definer set search_path = public as
$$ declare v uuid; mx int; cnt int; begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  select id, max_students into v, mx from organizations where slug = lower(trim(p_slug));
  if v is null then raise exception 'igreja não encontrada'; end if;
  if exists (select 1 from organization_members where org_id = v and user_id = auth.uid()) then return v; end if;
  select count(*) into cnt from organization_members where org_id = v and role = 'student';
  if cnt >= mx then raise exception 'limite de alunos da igreja atingido'; end if;
  insert into organization_members (org_id, user_id, role) values (v, auth.uid(), 'student');
  return v;
end $$;

-- 6) Registro de ações (feito por gatilhos no banco: ninguém consegue apagar nem falsificar pelo site)
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on audit_logs (org_id, created_at desc);
alter table audit_logs enable row level security;
create policy audit_select on audit_logs for select using (org_id is not null and is_admin(org_id));

create function log_change() returns trigger language plpgsql security definer set search_path = public as
$$ declare r jsonb; oid uuid; begin
  if tg_op = 'DELETE' then r := to_jsonb(old); else r := to_jsonb(new); end if;
  if tg_table_name = 'organizations' then oid := (r ->> 'id')::uuid; else oid := (r ->> 'org_id')::uuid; end if;
  insert into audit_logs (org_id, actor_id, action, entity, entity_id, details)
  values (oid, auth.uid(), tg_op, tg_table_name, nullif(r ->> 'id', '')::uuid,
    jsonb_build_object('resumo', coalesce(r ->> 'title', r ->> 'name', r ->> 'role'), 'status', r ->> 'status', 'usuario', r ->> 'user_id'));
  return null;
end $$;
create trigger audit_courses after insert or update or delete on courses for each row execute function log_change();
create trigger audit_members after insert or update or delete on organization_members for each row execute function log_change();
create trigger audit_paths after insert or update or delete on learning_paths for each row execute function log_change();
create trigger audit_certs after insert on certificates for each row execute function log_change();
create trigger audit_orgs after update or delete on organizations for each row execute function log_change();
