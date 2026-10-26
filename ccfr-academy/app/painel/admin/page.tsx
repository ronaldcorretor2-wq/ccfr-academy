import Link from 'next/link';
import { requireStaff } from '@/lib/ctx';
import { createCourse } from '../actions';

export default async function Admin({ searchParams }: { searchParams: { erro?: string } }) {
  const { supabase, member } = await requireStaff();
  const { data } = await supabase.from('courses').select('id,title,status').order('created_at');
  const courses: any[] = data ?? [];
  const label: Record<string, string> = { draft: 'Rascunho', published: 'Publicado', archived: 'Arquivado' };
  return (
    <>
      <h1>Administração</h1>
      {member.role === 'admin' && <div className="row"><Link className="b2" href="/painel/admin/pessoas">Pessoas: alunos e professores</Link></div>}
      <div className="row"><Link className="b2" href="/painel/admin/trilhas">Trilhas de formação</Link><Link className="b2" href="/painel/admin/relatorios">Relatórios</Link>{member.role === 'admin' && <Link className="b2" href="/painel/admin/auditoria">Registro de ações</Link>}</div>
      {searchParams.erro && <div className="erro" role="alert">{searchParams.erro}</div>}
      <form className="pn" action={createCourse}>
        <h2>Novo curso</h2>
        <label>Título do curso<input className="in" name="title" required minLength={2} /></label>
        <button className="btn" type="submit">Criar curso</button>
      </form>
      <section className="pn">
        <h2>Cursos da igreja</h2>
        {courses.map((c) => (
          <div className="li" key={c.id}>
            <Link href={`/painel/admin/cursos/${c.id}`}>{c.title}</Link>
            <span className="tag">{label[c.status] ?? c.status}</span>
          </div>
        ))}
        {!courses.length && <p className="m">Nenhum curso ainda. Crie o primeiro acima.</p>}
      </section>
    </>
  );
}
