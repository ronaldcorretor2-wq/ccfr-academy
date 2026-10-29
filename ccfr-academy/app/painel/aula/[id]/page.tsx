import SubmitButton from '@/components/SubmitButton';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCtx } from '@/lib/ctx';
import { loadLearning, prerequisiteFor, youtubeId } from '@/lib/data';
import Tabs from '@/components/Tabs';
import YouTubePlayer from '@/components/YouTubePlayer';
import { completeLesson, saveNote, savePosition, takeAssessment } from '../../actions';

type SP = { erro?: string; ok?: string; nota?: string; aprovado?: string; erradas?: string };

export default async function Aula({ params, searchParams }: { params: { id: string }; searchParams: SP }) {
  const { supabase, user, isStaff } = await getCtx();
  const { data: lesson } = await supabase.from('lessons').select('id,course_id,title,video_url,content').eq('id', params.id).maybeSingle();
  if (!lesson) notFound();
  const { courses, modules, byCourse, done } = await loadLearning(supabase, user.id);
  if (!isStaff) {
    const lock = await prerequisiteFor(supabase, lesson.course_id, byCourse, done, courses);
    if (lock) redirect(`/painel/cursos/${lesson.course_id}?erro=${encodeURIComponent('Conclua antes o curso: ' + lock)}`);
  }
  const list = byCourse[lesson.course_id] ?? [];
  const i = list.findIndex((l) => l.id === lesson.id);
  const prev = list[i - 1];
  const next = list[i + 1];
  const course = courses.find((c) => c.id === lesson.course_id);
  const vid = youtubeId(lesson.video_url);
  const { data: pg } = await supabase.from('lesson_progress').select('position_seconds').eq('lesson_id', lesson.id).eq('user_id', user.id).maybeSingle();
  const startAt = Number(pg?.position_seconds ?? 0);

  const { data: quiz } = await supabase.from('assessments').select('id,title,pass_score').eq('lesson_id', lesson.id).maybeSingle();
  let questions: any[] = [];
  let attempts: any[] = [];
  if (quiz) {
    const [q, a] = await Promise.all([
      supabase.from('assessment_questions').select('id,prompt,options,position').eq('assessment_id', quiz.id).order('position'),
      supabase.from('assessment_attempts').select('score,passed,created_at').eq('assessment_id', quiz.id).eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    ]);
    questions = q.data ?? [];
    attempts = a.data ?? [];
  }
  const [{ data: rs }, { data: nt }] = await Promise.all([
    supabase.from('lesson_resources').select('id,title,url,kind,storage_path').eq('lesson_id', lesson.id).order('position'),
    supabase.from('lesson_notes').select('content').eq('lesson_id', lesson.id).eq('user_id', user.id).maybeSingle(),
  ]);
  const resources: any[] = rs ?? [];
  const signed: Record<string, string> = {};
  const paths = resources.filter((r: any) => r.storage_path).map((r: any) => r.storage_path as string);
  if (paths.length) {
    const { data: su } = await supabase.storage.from('materiais').createSignedUrls(paths, 3600);
    for (const x of (su ?? []) as any[]) if (x.path && x.signedUrl) signed[x.path] = x.signedUrl;
  }
  const kinds: Record<string, string> = { link: 'Link', pdf: 'PDF', audio: 'Áudio', outro: 'Outro' };
  const hasQuiz = !!quiz && questions.length > 0;
  const passed = attempts.some((x: any) => x.passed);
  const canComplete = !hasQuiz || passed;

  const total = list.length;
  const doneCount = list.filter((l) => done.has(l.id)).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const mods = modules.filter((m) => m.course_id === lesson.course_id);
  const initial = searchParams.nota ? 'avaliacao' : (searchParams.ok ?? '').startsWith('Anotações') ? 'anotacoes' : 'materiais';
  const moduleOf = mods.find((m) => m.id === list[i]?.module_id);

  const materiais = (
    <>
      {lesson.content && <div className="pn" style={{ whiteSpace: 'pre-wrap' }}>{lesson.content}</div>}
      {resources.length > 0 ? (
        <section className="pn">
          <h2>Materiais complementares</h2>
          {resources.map((r: any) => (
            <div className="li" key={r.id} style={{ flexWrap: 'wrap' }}>
              <a href={(r.storage_path ? signed[r.storage_path] : r.url) ?? '#'} target="_blank" rel="noopener noreferrer">{r.title}</a>
              <span className="tag">{kinds[r.kind] ?? 'Link'}</span>
              {r.kind === 'audio' && r.storage_path && signed[r.storage_path] && (
                <audio controls preload="none" src={signed[r.storage_path]} style={{ width: '100%' }} />
              )}
            </div>
          ))}
        </section>
      ) : (
        !lesson.content && <p className="m">Esta aula não tem materiais.</p>
      )}
    </>
  );
  const anotacoes = (
    <form className="pn" action={saveNote}>
      <input type="hidden" name="lesson_id" value={lesson.id} />
      <h2>Minhas anotações</h2>
      <textarea className="in" name="content" defaultValue={nt?.content ?? ''} maxLength={5000} aria-label="Minhas anotações desta aula" />
      <SubmitButton className="b2" style={{ alignSelf: 'flex-start' }}>Salvar anotações</SubmitButton>
    </form>
  );
  const avaliacao = quiz && hasQuiz ? (
    <form className="pn" action={takeAssessment}>
      <input type="hidden" name="assessment_id" value={quiz.id} />
      <input type="hidden" name="lesson_id" value={lesson.id} />
      <h2>{quiz.title}</h2>
      <p className="m">Nota mínima para aprovação: {quiz.pass_score}%.</p>
      {searchParams.nota && (
        <div className={searchParams.aprovado === '1' ? 'ok' : 'erro'} role="status">
          Sua nota: {searchParams.nota}%. {searchParams.aprovado === '1' ? 'Aprovado!' : 'Ainda não atingiu a nota mínima.'}
          {searchParams.erradas ? ` Revise as questões: ${searchParams.erradas}.` : ''}
        </div>
      )}
      {questions.map((q: any, qi: number) => (
        <fieldset key={q.id} style={{ border: 0, padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <legend style={{ fontWeight: 700, marginBottom: 6 }}>{qi + 1}. {q.prompt}</legend>
          {(q.options as string[]).map((o: string, oi: number) => (
            <label key={oi} className="row" style={{ flexDirection: 'row', gap: 8, color: 'var(--tx)', fontSize: 15 }}>
              <input type="radio" name={`q_${q.id}`} value={oi} required />
              {o}
            </label>
          ))}
        </fieldset>
      ))}
      <SubmitButton className="btn">Enviar respostas</SubmitButton>
      {attempts.length > 0 && (
        <div>
          <h3>Suas tentativas</h3>
          {attempts.map((a: any, k: number) => (
            <div className="li" key={k}>
              <span className="m">{new Date(a.created_at).toLocaleString('pt-BR')}</span>
              <span>{a.score}% · {a.passed ? 'Aprovado' : 'Não aprovado'}</span>
            </div>
          ))}
        </div>
      )}
    </form>
  ) : null;
  const tabs = [
    { id: 'materiais', label: 'Materiais', content: materiais },
    { id: 'anotacoes', label: 'Anotações', content: anotacoes },
    ...(avaliacao ? [{ id: 'avaliacao', label: 'Avaliação', content: avaliacao }] : []),
  ];

  return (
    <div className="focus">
      <header className="ftop">
        <Link href={`/painel/cursos/${lesson.course_id}`}>← Voltar ao curso</Link>
        <span className="ttl">{course?.title ?? ''}</span>
        <div className="prog"><div className="bar"><i style={{ width: `${pct}%` }} /></div><span style={{ fontSize: 12 }}>{pct}%</span></div>
      </header>
      <div className="fgrid">
        <div className="fmain">
          {searchParams.erro && <div className="erro" role="alert">{searchParams.erro}</div>}
          {searchParams.ok && <div className="ok" role="status">{searchParams.ok}</div>}
          {vid ? (
            <YouTubePlayer videoId={vid} lessonId={lesson.id} start={startAt} save={savePosition} />
          ) : lesson.video_url ? (
            <a className="b2" href={lesson.video_url} target="_blank" rel="noopener noreferrer" style={{ alignSelf: 'flex-start' }}>Abrir vídeo em outra aba</a>
          ) : null}
          <div>
            <h1>{lesson.title}</h1>
            <p className="m">{moduleOf ? `${moduleOf.title} · ` : ''}Aula {i + 1} de {total}</p>
          </div>
          <div className="row">
            {prev ? <Link className="b2" href={`/painel/aula/${prev.id}`}>Aula anterior</Link> : null}
            {done.has(lesson.id) ? (
              <span className="tag y">Aula concluída</span>
            ) : canComplete ? (
              <form action={completeLesson}><input type="hidden" name="lesson_id" value={lesson.id} /><SubmitButton className="btn coral">Concluir aula</SubmitButton></form>
            ) : (
              <span className="m">Aprove na avaliação para concluir esta aula.</span>
            )}
            {next ? <Link className="b2" href={`/painel/aula/${next.id}`}>Próxima aula</Link> : null}
          </div>
          <Tabs tabs={tabs} initial={initial} />
        </div>
        <aside className="fside">
          <h2 style={{ marginBottom: 2 }}>Conteúdo do curso</h2>
          <p className="m" style={{ marginBottom: 8 }}>{pct}% concluído</p>
          {mods.map((m) => (
            <div key={m.id}>
              <p className="cap" style={{ margin: '14px 0 6px', color: '#A6A6A7' }}>{m.title}</p>
              {list.filter((l) => l.module_id === m.id).map((l) => (
                <Link key={l.id} href={`/painel/aula/${l.id}`} className={l.id === lesson.id ? 'fitem on' : 'fitem'}>
                  <span className={done.has(l.id) ? 'fst ok' : l.id === lesson.id ? 'fst cur' : 'fst'}>
                    {done.has(l.id) && <svg width="12" height="12" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M2 9l5 5 9-10" /></svg>}
                  </span>
                  <span>{l.title}</span>
                </Link>
              ))}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
