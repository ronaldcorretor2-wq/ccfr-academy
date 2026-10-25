import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCtx } from '@/lib/ctx';
import { embedUrl, loadLearning } from '@/lib/data';
import { completeLesson } from '../../actions';

export default async function Aula({ params, searchParams }: { params: { id: string }; searchParams: { erro?: string; ok?: string } }) {
  const { supabase, user } = await getCtx();
  const { data: lesson } = await supabase.from('lessons').select('id,course_id,title,video_url,content').eq('id', params.id).maybeSingle();
  if (!lesson) notFound();
  const { courses, byCourse, done } = await loadLearning(supabase, user.id);
  const list = byCourse[lesson.course_id] ?? [];
  const i = list.findIndex((l) => l.id === lesson.id);
  const prev = list[i - 1];
  const next = list[i + 1];
  const course = courses.find((c) => c.id === lesson.course_id);
  const embed = embedUrl(lesson.video_url);
  return (
    <>
      <div>
        <Link className="m" href={`/painel/cursos/${lesson.course_id}`}>Voltar para {course?.title ?? 'o curso'}</Link>
        <h1>{lesson.title}</h1>
      </div>
      {searchParams.erro && <div className="erro" role="alert">{searchParams.erro}</div>}
      {searchParams.ok && <div className="ok" role="status">{searchParams.ok}</div>}
      {embed ? (
        <iframe className="video" src={embed} title={lesson.title} allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
      ) : lesson.video_url ? (
        <a className="b2" href={lesson.video_url} target="_blank" rel="noopener noreferrer">Abrir vídeo em outra aba</a>
      ) : (
        <p className="m">Esta aula não tem vídeo.</p>
      )}
      {lesson.content && <div className="pn" style={{ whiteSpace: 'pre-wrap' }}>{lesson.content}</div>}
      <div className="row">
        {prev && <Link className="b2" href={`/painel/aula/${prev.id}`}>Aula anterior</Link>}
        {done.has(lesson.id) ? (
          <span className="tag">Aula concluída</span>
        ) : (
          <form action={completeLesson}><input type="hidden" name="lesson_id" value={lesson.id} /><button className="btn" type="submit">Concluir aula</button></form>
        )}
        {next && <Link className="b2" href={`/painel/aula/${next.id}`}>Próxima aula</Link>}
      </div>
    </>
  );
}
