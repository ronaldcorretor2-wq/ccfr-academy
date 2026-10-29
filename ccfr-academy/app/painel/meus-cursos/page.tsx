import Link from 'next/link';
import { getCtx } from '@/lib/ctx';
import { loadLearning, signCovers } from '@/lib/data';
import CourseCard from '@/components/CourseCard';

export default async function MeusCursos() {
  const { supabase, user } = await getCtx();
  const { courses, byCourse, done } = await loadLearning(supabase, user.id);
  const covers = await signCovers(supabase, courses);
  const { data: en } = await supabase.from('enrollments').select('course_id').eq('user_id', user.id);
  const { data: fv } = await supabase.from('favorites').select('course_id').eq('user_id', user.id);
  const enrolled = new Set<string>(((en ?? []) as any[]).map((x: any) => x.course_id as string));
  const favs = new Set<string>(((fv ?? []) as any[]).map((x: any) => x.course_id as string));
  const pct = (id: string) => {
    const ls = byCourse[id] ?? [];
    return ls.length ? Math.round((ls.filter((l) => done.has(l.id)).length / ls.length) * 100) : 0;
  };
  const mine = courses.filter((c) => enrolled.has(c.id) || pct(c.id) > 0).sort((a, b) => Number(favs.has(b.id)) - Number(favs.has(a.id)));
  return (
    <>
      <div>
        <h1>Meus cursos</h1>
        <p className="m">Os cursos em que você está matriculado ou já começou.</p>
      </div>
      <div className="ccards">{mine.map((c) => <CourseCard key={c.id} c={c} pct={pct(c.id)} cover={covers[c.id]} fav={favs.has(c.id)} />)}</div>
      {!mine.length && (
        <section className="pn">
          <h3>Você ainda não começou nenhum curso</h3>
          <p className="m">Escolha um curso no catálogo para começar.</p>
          <Link className="btn coral" href="/painel/catalogo">Ver catálogo</Link>
        </section>
      )}
    </>
  );
}
