import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireStaff } from '@/lib/ctx';
import ConfirmButton from '@/components/ConfirmButton';
import { addLesson, addModule, deleteCourse, deleteLesson, deleteModule, moveLesson, moveModule, setStatus, updateCourse } from '../../../actions';

export default async function CursoAdmin({ params, searchParams }: { params: { id: string }; searchParams: { erro?: string; ok?: string } }) {
  const { supabase } = await requireStaff();
  const id = params.id;
  const { data: course } = await supabase.from('courses').select('id,title,description,status').eq('id', id).maybeSingle();
  if (!course) notFound();
  const [{ data: m }, { data: l }, { data: e }] = await Promise.all([
    supabase.from('course_modules').select('id,title,position').eq('course_id', id).order('position'),
    supabase.from('lessons').select('id,module_id,title,position').eq('course_id', id).order('position'),
    supabase.from('enrollments').select('user_id, profiles(full_name)').eq('course_id', id),
  ]);
  const mods: any[] = m ?? [];
  const lessons: any[] = l ?? [];
  const enrolled: any[] = e ?? [];
  const ids = lessons.map((x) => x.id);
  const { data: pr } = ids.length
    ? await supabase.from('lesson_progress').select('user_id,lesson_id').eq('completed', true).in('lesson_id', ids)
    : { data: [] as any[] };
  const doneBy: Record<string, number> = {};
  for (const r of (pr ?? []) as any[]) doneBy[r.user_id] = (doneBy[r.user_id] ?? 0) + 1;
  const published = course.status === 'published';
  const nameOf = (x: any) => (Array.isArray(x.profiles) ? x.profiles[0]?.full_name : x.profiles?.full_name) || 'Aluno sem nome';

  return (
    <>
      <div>
        <Link className="m" href="/painel/admin">Voltar à administração</Link>
        <h1>{course.title}</h1>
        <span className="tag">{published ? 'Publicado' : course.status === 'archived' ? 'Arquivado' : 'Rascunho'}</span>
      </div>
      {searchParams.erro && <div className="erro" role="alert">{searchParams.erro}</div>}
      {searchParams.ok && <div className="ok" role="status">{searchParams.ok}</div>}

      <form className="pn" action={updateCourse}>
        <input type="hidden" name="id" value={id} />
        <h2>Dados do curso</h2>
        <label>Título<input className="in" name="title" defaultValue={course.title} required /></label>
        <label>Descrição<textarea className="in" name="description" defaultValue={course.description} /></label>
        <button className="btn" type="submit">Salvar alterações</button>
      </form>

      <section className="pn">
        <h2>Módulos e aulas</h2>
        {mods.map((mod) => (
          <div key={mod.id} className="pn" style={{ background: '#111' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3>{mod.title}</h3>
              <Mover action={moveModule} id={mod.id} courseId={id} />
              <form action={deleteModule}>
                <input type="hidden" name="id" value={mod.id} /><input type="hidden" name="course_id" value={id} />
                <ConfirmButton message="Excluir este módulo e todas as suas aulas?">Excluir módulo</ConfirmButton>
              </form>
            </div>
            {lessons.filter((x) => x.module_id === mod.id).map((x) => (
              <div className="li" key={x.id}>
                <span style={{ flex: 1 }}>{x.title}</span>
                <Mover action={moveLesson} id={x.id} courseId={id} moduleId={mod.id} />
                <Link className="b2" href={`/painel/admin/aulas/${x.id}`}>Editar</Link>
                <form action={deleteLesson}>
                  <input type="hidden" name="id" value={x.id} /><input type="hidden" name="course_id" value={id} />
                  <ConfirmButton message="Excluir esta aula?">Excluir</ConfirmButton>
                </form>
              </div>
            ))}
            <form className="pn" action={addLesson}>
              <input type="hidden" name="course_id" value={id} /><input type="hidden" name="module_id" value={mod.id} />
              <h3>Nova aula neste módulo</h3>
              <label>Título da aula<input className="in" name="title" required /></label>
              <label>Link do vídeo (YouTube, opcional)<input className="in" name="video_url" type="url" placeholder="https://www.youtube.com/watch?v=..." /></label>
              <label>Texto da aula (opcional)<textarea className="in" name="content" /></label>
              <button className="btn" type="submit">Adicionar aula</button>
            </form>
          </div>
        ))}
        <form className="row" action={addModule}>
          <input type="hidden" name="course_id" value={id} />
          <label style={{ flex: 1 }}>Novo módulo<input className="in" name="title" required placeholder="Ex.: Módulo 1: Quem é Deus" /></label>
          <button className="btn" type="submit" style={{ alignSelf: 'flex-end' }}>Adicionar módulo</button>
        </form>
      </section>

      <section className="pn">
        <h2>Publicação</h2>
        <p className="m">Para publicar, o curso precisa de título, descrição e pelo menos uma aula.</p>
        <div className="row">
          <form action={setStatus}>
            <input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={published ? 'draft' : 'published'} />
            <button className="btn" type="submit">{published ? 'Voltar para rascunho' : 'Publicar curso'}</button>
          </form>
          <form action={deleteCourse}>
            <input type="hidden" name="id" value={id} />
            <ConfirmButton message="Excluir este curso, seus módulos, aulas e o progresso dos alunos? Não dá para desfazer.">Excluir curso</ConfirmButton>
          </form>
        </div>
      </section>

      <section className="pn">
        <h2>Progresso dos alunos</h2>
        {enrolled.map((x) => (
          <div className="li" key={x.user_id}>
            <span>{nameOf(x)}</span>
            <span className="m">{doneBy[x.user_id] ?? 0} de {lessons.length} aulas concluídas</span>
          </div>
        ))}
        {!enrolled.length && <p className="m">Nenhum aluno matriculado ainda.</p>}
      </section>
    </>
  );
}

function Mover({ action, id, courseId, moduleId }: { action: (fd: FormData) => Promise<void>; id: string; courseId: string; moduleId?: string }) {
  return (
    <span className="row" style={{ gap: 6 }}>
      {(['up', 'down'] as const).map((d) => (
        <form key={d} action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="course_id" value={courseId} />
          {moduleId && <input type="hidden" name="module_id" value={moduleId} />}
          <input type="hidden" name="dir" value={d} />
          <button className="b2" type="submit">{d === 'up' ? 'Subir' : 'Descer'}</button>
        </form>
      ))}
    </span>
  );
}
