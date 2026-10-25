import Link from 'next/link';
import { requireStaff } from '@/lib/ctx';
import { createPath } from '../../actions';

export default async function AdminTrilhas({ searchParams }: { searchParams: { erro?: string } }) {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from('learning_paths').select('id,title,status').order('created_at');
  const paths: any[] = data ?? [];
  const label: Record<string, string> = { draft: 'Rascunho', published: 'Publicada', archived: 'Arquivada' };
  return (
    <>
      <div>
        <Link className="m" href="/painel/admin">Voltar à administração</Link>
        <h1>Trilhas de formação</h1>
      </div>
      {searchParams.erro && <div className="erro" role="alert">{searchParams.erro}</div>}
      <form className="pn" action={createPath}>
        <h2>Nova trilha</h2>
        <label>Título da trilha<input className="in" name="title" required minLength={2} /></label>
        <button className="btn" type="submit">Criar trilha</button>
      </form>
      <section className="pn">
        <h2>Trilhas da igreja</h2>
        {paths.map((p) => (
          <div className="li" key={p.id}>
            <Link href={`/painel/admin/trilhas/${p.id}`}>{p.title}</Link>
            <span className="tag">{label[p.status] ?? p.status}</span>
          </div>
        ))}
        {!paths.length && <p className="m">Nenhuma trilha ainda.</p>}
      </section>
    </>
  );
}
