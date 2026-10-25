import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCtx } from '@/lib/ctx';
import { loadLearning } from '@/lib/data';
import { enroll } from '../../actions';

export default async function Curso({ params }: { params: { id: string } }) {
  const { supabase, user, member } = await getCtx();
  const { courses, modules, byCourse, done } = await loadLearning(supabase, user.id);
  const course = courses.find((c) => c.id === params.id);
  if (!course) notFound();
  const { data: enr } = await supabase.from('enrollments').select('course_id').eq('course_id', params.id).eq('user_id', user.id).maybeSingle();
  const lessons = byCourse[params.id] ?? [];
  const first = lessons.find((l) => !done.has(l.id)) ?? lessons[0];
  const mods = modules.filter((m) => m.course_id === params.id);
  return (
    <>
      <div>
        <Link className="m" href="/painel">Voltar aos cursos</Link>
        <h1>{course.title}</h1>
        <p className="m">{course.description}</p>
      </div>
      {first && (enr || !member ? (
        <Link className="btn" href={`/painel/aula/${first.id}`}>{lessons.some((l) => done.has(l.id)) ? 'Continuar curso' : 'Começar curso'}</Link>
      ) : (
        <form action={enroll}><input type="hidden" name="course_id" value={params.id} /><button className="btn" type="submit">Matricular-se</button></form>
      ))}
      {mods.map((m) => (
        <section key={m.id} className="pn">
          <h2>{m.title}</h2>
          {lessons.filter((l) => l.module_id === m.id).map((l) => (
            <div className="li" key={l.id}>
              <Link href={`/painel/aula/${l.id}`}>{l.title}</Link>
              <span className="m">{done.has(l.id) ? 'Concluída' : 'Pendente'}</span>
            </div>
          ))}
          {!lessons.some((l) => l.module_id === m.id) && <p className="m">Este módulo ainda não tem aulas.</p>}
        </section>
      ))}
      {!mods.length && <p className="m">Este curso ainda não tem conteúdo.</p>}
    </>
  );
}
