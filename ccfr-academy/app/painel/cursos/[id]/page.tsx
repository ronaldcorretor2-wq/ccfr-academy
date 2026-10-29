import SubmitButton from '@/components/SubmitButton';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCtx } from '@/lib/ctx';
import CourseCover from '@/components/CourseCover';
import { loadLearning, prerequisiteFor, signCovers } from '@/lib/data';
import { enroll, issueCertificate, toggleFavorite } from '../../actions';

export default async function Curso({ params, searchParams }: { params: { id: string }; searchParams: { erro?: string } }) {
  const { supabase, user, member, isStaff } = await getCtx();
  const { courses, modules, byCourse, done } = await loadLearning(supabase, user.id);
  const course = courses.find((c) => c.id === params.id);
  if (!course) notFound();
  const covers = await signCovers(supabase, [course]);
  const lock = isStaff ? null : await prerequisiteFor(supabase, params.id, byCourse, done, courses);
  const { data: enr } = await supabase.from('enrollments').select('course_id').eq('course_id', params.id).eq('user_id', user.id).maybeSingle();
  const { data: cert } = await supabase.from('certificates').select('id').eq('course_id', params.id).eq('user_id', user.id).maybeSingle();
  const { data: fav } = await supabase.from('favorites').select('course_id').eq('course_id', params.id).eq('user_id', user.id).maybeSingle();
  const lessons = byCourse[params.id] ?? [];
  const first = lessons.find((l) => !done.has(l.id)) ?? lessons[0];
  const finished = lessons.length > 0 && lessons.every((l) => done.has(l.id));
  const mods = modules.filter((m) => m.course_id === params.id);
  return (
    <>
      <div>
        <Link className="m" href="/painel">Voltar aos cursos</Link>
        <h1>{course.title}</h1>
        <p className="m">{course.description}</p>
      </div>
      <CourseCover id={params.id} title={course.title} h={180} src={covers[params.id]} />
      {searchParams.erro && <div className="erro" role="alert">{searchParams.erro}</div>}
      {lock && <div className="erro" role="status">Este curso faz parte de uma trilha. Conclua antes: {lock}.</div>}
      <div className="row">
        {first && !lock && (enr || !member ? (
          <Link className="btn coral" href={`/painel/aula/${first.id}`}>{lessons.some((l) => done.has(l.id)) ? 'Continuar curso' : 'Começar curso'}</Link>
        ) : (
          <form action={enroll}><input type="hidden" name="course_id" value={params.id} /><SubmitButton className="btn coral">Matricular-se</SubmitButton></form>
        ))}
        {member && (
          <form action={toggleFavorite}>
            <input type="hidden" name="course_id" value={params.id} />
            <SubmitButton className="b2">{fav ? 'Remover dos favoritos' : 'Favoritar'}</SubmitButton>
          </form>
        )}
      </div>
      {finished && (
        <section className="pn">
          <h2>Você concluiu este curso</h2>
          {cert ? (
            <Link className="btn" href={`/painel/certificados/${cert.id}`}>Ver certificado</Link>
          ) : (
            <form action={issueCertificate}><input type="hidden" name="course_id" value={params.id} /><SubmitButton className="btn">Emitir certificado</SubmitButton></form>
          )}
        </section>
      )}
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
