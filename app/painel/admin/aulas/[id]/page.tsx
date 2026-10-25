import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireStaff } from '@/lib/ctx';
import { updateLesson } from '../../../actions';

export default async function EditarAula({ params, searchParams }: { params: { id: string }; searchParams: { erro?: string } }) {
  const { supabase } = await requireStaff();
  const { data: a } = await supabase.from('lessons').select('id,course_id,title,video_url,content').eq('id', params.id).maybeSingle();
  if (!a) notFound();
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
    </>
  );
}
