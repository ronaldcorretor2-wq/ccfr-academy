import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireStaff } from '@/lib/ctx';
import UploadResource from '@/components/UploadResource';
import ConfirmButton from '@/components/ConfirmButton';
import { addQuestion, addResource, createAssessment, deleteAssessment, deleteQuestion, deleteResource, registerUpload, updateLesson } from '../../../actions';

export default async function EditarAula({ params, searchParams }: { params: { id: string }; searchParams: { erro?: string } }) {
  const { supabase, member } = await requireStaff();
  const { data: a } = await supabase.from('lessons').select('id,course_id,title,video_url,content').eq('id', params.id).maybeSingle();
  if (!a) notFound();
  const { data: quiz } = await supabase.from('assessments').select('id,title,pass_score').eq('lesson_id', a.id).maybeSingle();
  const { data: rs } = await supabase.from('lesson_resources').select('id,title,url,storage_path').eq('lesson_id', a.id).order('position');
  const resources: any[] = rs ?? [];
  let questions: any[] = [];
  const keys: Record<string, number> = {};
  if (quiz) {
    const [q, k] = await Promise.all([
      supabase.from('assessment_questions').select('id,prompt,options,position').eq('assessment_id', quiz.id).order('position'),
      supabase.from('assessment_answers').select('question_id,correct_index'),
    ]);
    questions = q.data ?? [];
    for (const r of (k.data ?? []) as any[]) keys[r.question_id] = r.correct_index;
  }
  return (
    <>
      <div>
        <Link className="m" href={`/painel/admin/cursos/${a.course_id}`}>Voltar ao curso</Link>
        <h1>Editar aula</h1>
      </div>
      {searchParams.erro && <div className="erro" role="alert">{searchParams.erro}</div>}
      <form className="pn" action={updateLesson}>
        <input type="hidden" name="id" value={a.id} />
        <input type="hidden" name="course_id" value={a.course_id} />
        <label>Título da aula<input className="in" name="title" defaultValue={a.title} required /></label>
        <label>Link do vídeo (YouTube, opcional)<input className="in" name="video_url" type="url" defaultValue={a.video_url ?? ''} /></label>
        <label>Texto da aula<textarea className="in" name="content" defaultValue={a.content} /></label>
        <button className="btn" type="submit">Salvar aula</button>
      </form>

      <section className="pn">
        <h2>Avaliação da aula</h2>
        {!quiz ? (
          <form className="pn" action={createAssessment} style={{ background: 'var(--soft)' }}>
            <input type="hidden" name="lesson_id" value={a.id} />
            <p className="m">Esta aula ainda não tem avaliação. Quando houver, o aluno só conclui a aula depois de ser aprovado.</p>
            <label>Título<input className="in" name="title" defaultValue="Questionário" /></label>
            <label>Nota mínima para aprovação (de 1 a 100)<input className="in" name="pass_score" type="number" min={1} max={100} defaultValue={70} /></label>
            <button className="btn" type="submit">Criar avaliação</button>
          </form>
        ) : (
          <>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span>{quiz.title} · nota mínima {quiz.pass_score}%</span>
              <form action={deleteAssessment}>
                <input type="hidden" name="id" value={quiz.id} /><input type="hidden" name="lesson_id" value={a.id} />
                <ConfirmButton message="Excluir a avaliação, as perguntas e as tentativas dos alunos?">Excluir avaliação</ConfirmButton>
              </form>
            </div>
            {questions.map((q: any, qi: number) => (
              <div className="li" key={q.id} style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3>{qi + 1}. {q.prompt}</h3>
                  {(q.options as string[]).map((o: string, oi: number) => (
                    <p className="m" key={oi}>{oi === keys[q.id] ? 'Correta: ' : ''}{o}</p>
                  ))}
                </div>
                <form action={deleteQuestion}>
                  <input type="hidden" name="id" value={q.id} /><input type="hidden" name="lesson_id" value={a.id} />
                  <ConfirmButton message="Excluir esta pergunta?">Excluir</ConfirmButton>
                </form>
              </div>
            ))}
            <form className="pn" action={addQuestion} style={{ background: 'var(--soft)' }}>
              <input type="hidden" name="assessment_id" value={quiz.id} /><input type="hidden" name="lesson_id" value={a.id} />
              <h3>Nova pergunta de múltipla escolha</h3>
              <label>Pergunta<input className="in" name="prompt" required /></label>
              <label>Alternativa A<input className="in" name="opt0" /></label>
              <label>Alternativa B<input className="in" name="opt1" /></label>
              <label>Alternativa C (opcional)<input className="in" name="opt2" /></label>
              <label>Alternativa D (opcional)<input className="in" name="opt3" /></label>
              <label>Alternativa correta
                <select className="in" name="correct" defaultValue="0">
                  <option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option>
                </select>
              </label>
              <button className="btn" type="submit">Adicionar pergunta</button>
            </form>
          </>
        )}
      </section>

      <section className="pn">
        <h2>Materiais complementares</h2>
        <p className="m">Envie um PDF ou áudio direto daqui, ou cole o link de um material que já esteja na internet.</p>
        {resources.map((r: any) => (
          <div className="li" key={r.id}>
            <span style={{ flex: 1 }}>{r.title} <span className="m">({r.url ?? 'arquivo enviado'})</span></span>
            <form action={deleteResource}>
              <input type="hidden" name="id" value={r.id} /><input type="hidden" name="lesson_id" value={a.id} />
              <ConfirmButton message="Excluir este material?">Excluir</ConfirmButton>
            </form>
          </div>
        ))}
        <UploadResource lessonId={a.id} orgId={member.orgId} register={registerUpload} />
        <form className="pn" action={addResource} style={{ background: 'var(--soft)' }}>
          <input type="hidden" name="lesson_id" value={a.id} />
          <label>Título<input className="in" name="title" required /></label>
          <label>Endereço (link)<input className="in" name="url" type="url" required placeholder="https://..." /></label>
          <label>Tipo
            <select className="in" name="kind" defaultValue="link">
              <option value="link">Link</option><option value="pdf">PDF</option><option value="audio">Áudio</option><option value="outro">Outro</option>
            </select>
          </label>
          <button className="btn" type="submit">Adicionar material</button>
        </form>
      </section>
    </>
  );
}
