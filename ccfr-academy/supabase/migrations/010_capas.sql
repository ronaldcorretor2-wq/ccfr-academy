-- CCFR Academy: foto de capa por curso (enviada pela equipe da igreja).
-- Cole no SQL Editor do Supabase e clique em Run. Pode rodar mais de uma vez. Rode depois do 001 a 009.
alter table courses add column if not exists cover_path text;
