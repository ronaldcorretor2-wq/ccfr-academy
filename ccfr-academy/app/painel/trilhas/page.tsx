import Link from 'next/link';
import { getCtx } from '@/lib/ctx';
import { loadLearning } from '@/lib/data';

export default async function Trilhas() {
  const { supabase, user } = await getCtx();
  const { courses, byCourse, done } = await loadLearning(supabase, user.id);
  const [{ data: ps }, { data: pcs }] = await Promise.all([
    supabase.from('learning_paths').select('id,title,description').eq('status', 'published').order('created_at'),
    supabase.from('learning_path_courses').select('path_id,course_id,position').order('position'),
  ]);
  const paths: any[] = ps ?? [];
  const rows: any[] = pcs ?? [];
  const complete = (id: string) => {
    const ls = byCourse[id] ?? [];
    return ls.length > 0 && ls.every((l: any) => done.has(l.id));
  };
  const pct = (id: string) => {
    const ls = byCourse[id] ?? [];
    return ls.length ? Math.round((ls.filter((l: any) => done.has(l.id)).length / ls.length) * 100) : 0;
  };
  return (
    <>
      <div>
        <h1>Trilhas de formação</h1>
        <p className="m">Cada trilha é uma sequência de cursos. Para abrir um curso, conclua os anteriores da trilha.</p>
      </div>
      {paths.map((p) => {
        const items = rows.filter((r) => r.path_id === p.id).map((r) => courses.find((c) => c.id === r.course_id)).filter(Boolean) as any[];
        return (
          <section key={p.id} className="pn">
            <h2>{p.title}</h2>
            {p.description && <p className="m">{p.description}</p>}
            {items.map((c, i) => {
              const blocked = items.slice(0, i).some((x) => !complete(x.id));
              return (
                <div className="li" key={c.id}>
                  <span>{i + 1}. {blocked ? c.title : <Link href={`/painel/cursos/${c.id}`}>{c.title}</Link>}</span>
                  <span className="m">{blocked ? 'Bloqueado até concluir o anterior' : `${pct(c.id)}% concluído`}</span>
                </div>
              );
            })}
          </section>
        );
      })}
      {!paths.length && <p className="m">Nenhuma trilha publicada ainda.</p>}
    </>
  );
}
