import Link from 'next/link';
import { getCtx } from '@/lib/ctx';
import { loadLearning, signCovers } from '@/lib/data';
import CourseCard from '@/components/CourseCard';

const FILTROS: [string, string][] = [['todos', 'Todos'], ['novos', 'Não iniciados'], ['andamento', 'Em andamento'], ['concluidos', 'Concluídos']];

export default async function Catalogo({ searchParams }: { searchParams: { f?: string } }) {
  const { supabase, user } = await getCtx();
  const { courses, byCourse, done } = await loadLearning(supabase, user.id);
  const covers = await signCovers(supabase, courses);
  const { data: fv } = await supabase.from('favorites').select('course_id').eq('user_id', user.id);
  const favs = new Set<string>(((fv ?? []) as any[]).map((x: any) => x.course_id as string));
  const pct = (id: string) => {
    const ls = byCourse[id] ?? [];
    return ls.length ? Math.round((ls.filter((l) => done.has(l.id)).length / ls.length) * 100) : 0;
  };
  const f = FILTROS.some(([k]) => k === searchParams.f) ? (searchParams.f as string) : 'todos';
  const list = courses.filter((c) => f === 'todos' || (f === 'novos' && pct(c.id) === 0) || (f === 'andamento' && pct(c.id) > 0 && pct(c.id) < 100) || (f === 'concluidos' && pct(c.id) === 100));
  return (
    <>
      <div>
        <h1>Catálogo de cursos</h1>
        <p className="m">Escolha seu próximo passo de formação.</p>
      </div>
      <div className="chips" style={{ marginBottom: 0 }}>
        {FILTROS.map(([k, label]) => <Link key={k} href={`/painel/catalogo?f=${k}`} className={f === k ? 'chipb on' : 'chipb'}>{label}</Link>)}
      </div>
      <div className="ccards">{list.map((c) => <CourseCard key={c.id} c={c} pct={pct(c.id)} cover={covers[c.id]} fav={favs.has(c.id)} />)}</div>
      {!list.length && <p className="m">Nenhum curso nesta categoria.</p>}
    </>
  );
}
