-- CCFR Academy: notificações dentro do site (novo aviso, novo curso publicado, certificado pronto).
-- Cole no SQL Editor do Supabase e clique em Run. Pode rodar mais de uma vez. Rode depois do 001 a 008.

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on notifications (user_id, created_at desc);
alter table notifications enable row level security;

drop policy if exists notif_select on notifications;
create policy notif_select on notifications for select using (user_id = auth.uid());
drop policy if exists notif_update on notifications;
create policy notif_update on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists notif_delete on notifications;
create policy notif_delete on notifications for delete using (user_id = auth.uid());
-- A pessoa só pode marcar como lida; quem cria as notificações são os gatilhos abaixo
revoke update on notifications from authenticated;
grant update (read_at) on notifications to authenticated;

create or replace function notify_announcement() returns trigger language plpgsql security definer set search_path = public as
$$ begin
  insert into notifications (org_id, user_id, title, body, link)
  select new.org_id, m.user_id, 'Novo aviso: ' || new.title, left(new.body, 200), '/painel'
  from organization_members m where m.org_id = new.org_id and m.user_id is distinct from new.author_id;
  return null;
end $$;
drop trigger if exists notify_announcement on announcements;
create trigger notify_announcement after insert on announcements for each row execute function notify_announcement();

create or replace function notify_course_published() returns trigger language plpgsql security definer set search_path = public as
$$ begin
  if new.status = 'published' and old.status is distinct from 'published' then
    insert into notifications (org_id, user_id, title, body, link)
    select new.org_id, m.user_id, 'Novo curso disponível: ' || new.title, left(new.description, 200), '/painel/cursos/' || new.id
    from organization_members m where m.org_id = new.org_id and m.role = 'student';
  end if;
  return null;
end $$;
drop trigger if exists notify_course_published on courses;
create trigger notify_course_published after update on courses for each row execute function notify_course_published();

create or replace function notify_certificate() returns trigger language plpgsql security definer set search_path = public as
$$ begin
  insert into notifications (org_id, user_id, title, body, link)
  values (new.org_id, new.user_id, 'Seu certificado está pronto', new.course_title, '/painel/certificados/' || new.id);
  return null;
end $$;
drop trigger if exists notify_certificate on certificates;
create trigger notify_certificate after insert on certificates for each row execute function notify_certificate();
