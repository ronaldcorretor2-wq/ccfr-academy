import Link from 'next/link';
import { getCtx } from '@/lib/ctx';
import { loadLearning } from '@/lib/data';

export default async function Buscar({ searchParams }: { searchParams: { q?: string } }) {
  const { supabase, user } = await getCtx();
  const q = (searchParams.q ?? '').trim().replace(/[%,()*\\]/g, ' ').slice(0, 60).trim();
  let found: any[] = [];
  let lessons: any[] = [];
  if (q.length >= 2) {
    const [c, l] = await Promise.all([
      supabase.from('courses').select('id,title,description').ilike('title', `%${q}%`).limit(20),
      supabase.from('lessons').select('id,title,course_id').ilike('title', `%${q}%`).limit(20),
    ]);
    found = c.data ?? [];
    lessons = l.data ?? [];
  }
  const { courses } = await loadLearning(supabase, user.id);
  const titleOf = (id: string) => courses.find((c) => c.id === id)?.title ?? 'Curso';
  return (
    <>
      <div>
        <h1>Busca</h1>
        <p className="m">{q.length >= 2 ? `Resultados para “${q}”` : 'Digite pelo menos 2 letras para buscar cursos e aulas.'}</p>
      </div>
      {q.length >= 2 && (
        <>
          <section className="pn">
            <h2>Cursos</h2>
            {found.map((c) => (
              <Link key={c.id} href={`/painel/cursos/${c.id}`} className="li" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, textDecoration: 'none' }}>
                <span style={{ fontWeight: 500 }}>{c.title}</span>
                {c.description && <span className="m" style={{ fontSize: 12 }}>{String(c.description).slice(0, 120)}</span>}
              </Link>
            ))}
            {!found.length && <p className="m">Nenhum curso encontrado.</p>}
          </section>
          <section className="pn">
            <h2>Aulas</h2>
            {lessons.map((l) => (
              <Link key={l.id} href={`/painel/aula/${l.id}`} className="li" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, textDecoration: 'none' }}>
                <span style={{ fontWeight: 500 }}>{l.title}</span>
                <span className="m" style={{ fontSize: 12 }}>{titleOf(l.course_id)}</span>
              </Link>
            ))}
            {!lessons.length && <p className="m">Nenhuma aula encontrada.</p>}
          </section>
        </>
      )}
    </>
  );
}
