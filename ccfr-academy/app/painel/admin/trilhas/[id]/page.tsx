import SubmitButton from '@/components/SubmitButton';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireStaff } from '@/lib/ctx';
import ConfirmButton from '@/components/ConfirmButton';
import { addPathCourse, deletePath, movePathCourse, removePathCourse, setPathStatus, updatePath } from '../../../actions';

export default async function EditarTrilha({ params, searchParams }: { params: { id: string }; searchParams: { erro?: string; ok?: string } }) {
  const { supabase } = await requireStaff();
  const id = params.id;
  const { data: path } = await supabase.from('learning_paths').select('id,title,description,status').eq('id', id).maybeSingle();
  if (!path) notFound();
  const [{ data: pcs }, { data: cs }] = await Promise.all([
    supabase.from('learning_path_courses').select('id,course_id,position').eq('path_id', id).order('position'),
    supabase.from('courses').select('id,title').order('created_at'),
  ]);
  const rows: any[] = pcs ?? [];
  const courses: any[] = cs ?? [];
  const inPath = new Set<string>(rows.map((r: any) => r.course_id as string));
  const free = courses.filter((c) => !inPath.has(c.id));
  const published = path.status === 'published';
  return (
    <>
      <div>
        <Link className="m" href="/painel/admin/trilhas">Voltar às trilhas</Link>
        <h1>{path.title}</h1>
        <span className="tag">{published ? 'Publicada' : 'Rascunho'}</span>
      </div>
      {searchParams.erro && <div className="erro" role="alert">{searchParams.erro}</div>}
      {searchParams.ok && <div className="ok" role="status">{searchParams.ok}</div>}
      <form className="pn" action={updatePath}>
        <input type="hidden" name="id" value={id} />
        <label>Título<input className="in" name="title" defaultValue={path.title} required /></label>
        <label>Descrição<textarea className="in" name="description" defaultValue={path.description} /></label>
        <SubmitButton className="btn">Salvar</SubmitButton>
      </form>
      <section className="pn">
        <h2>Cursos da trilha, em ordem</h2>
        <p className="m">O aluno só abre um curso depois de concluir todos os anteriores da trilha.</p>
        {rows.map((r, i) => (
          <div className="li" key={r.id}>
            <span style={{ flex: 1 }}>{i + 1}. {courses.find((c) => c.id === r.course_id)?.title ?? 'Curso'}</span>
            {(['up', 'down'] as const).map((d) => (
              <form key={d} action={movePathCourse}>
                <input type="hidden" name="id" value={r.id} /><input type="hidden" name="path_id" value={id} /><input type="hidden" name="dir" value={d} />
                <SubmitButton className="b2">{d === 'up' ? 'Subir' : 'Descer'}</SubmitButton>
              </form>
            ))}
            <form action={removePathCourse}>
              <input type="hidden" name="id" value={r.id} /><input type="hidden" name="path_id" value={id} />
              <ConfirmButton message="Tirar este curso da trilha?">Tirar</ConfirmButton>
            </form>
          </div>
        ))}
        {!rows.length && <p className="m">Nenhum curso na trilha ainda.</p>}
        {free.length > 0 && (
          <form className="row" action={addPathCourse}>
            <input type="hidden" name="path_id" value={id} />
            <label style={{ flex: 1 }}>Adicionar curso
              <select className="in" name="course_id">{free.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
            </label>
            <SubmitButton className="btn" style={{ alignSelf: 'flex-end' }}>Adicionar</SubmitButton>
          </form>
        )}
      </section>
      <section className="pn">
        <h2>Publicação</h2>
        <div className="row">
          <form action={setPathStatus}>
            <input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={published ? 'draft' : 'published'} />
            <SubmitButton className="btn">{published ? 'Voltar para rascunho' : 'Publicar trilha'}</SubmitButton>
          </form>
          <form action={deletePath}>
            <input type="hidden" name="id" value={id} />
            <ConfirmButton message="Excluir esta trilha? Os cursos não são apagados.">Excluir trilha</ConfirmButton>
          </form>
        </div>
      </section>
    </>
  );
}
