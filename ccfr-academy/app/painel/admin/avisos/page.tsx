import Link from 'next/link';
import { requireStaff } from '@/lib/ctx';
import ConfirmButton from '@/components/ConfirmButton';
import { createAnnouncement, deleteAnnouncement } from '../../actions';

export default async function Avisos({ searchParams }: { searchParams: { erro?: string; ok?: string } }) {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from('announcements').select('id,title,body,created_at').order('created_at', { ascending: false }).limit(50);
  const items: any[] = data ?? [];
  return (
    <>
      <div>
        <Link className="m" href="/painel/admin">Voltar à administração</Link>
        <h1>Avisos da igreja</h1>
        <p className="m">Os avisos aparecem no painel de todos os alunos.</p>
      </div>
      {searchParams.erro && <div className="erro" role="alert">{searchParams.erro}</div>}
      {searchParams.ok && <div className="ok" role="status">{searchParams.ok}</div>}
      <form className="pn" action={createAnnouncement}>
        <h2>Novo aviso</h2>
        <label>Título<input className="in" name="title" required maxLength={160} /></label>
        <label>Texto (opcional)<textarea className="in" name="body" maxLength={2000} /></label>
        <button className="btn" type="submit">Publicar aviso</button>
      </form>
      <section className="pn">
        <h2>Avisos publicados</h2>
        {items.map((a) => (
          <div className="li" key={a.id} style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h3>{a.title}</h3>
              {a.body && <p className="m" style={{ whiteSpace: 'pre-wrap' }}>{a.body}</p>}
              <p className="m">{new Date(a.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            <form action={deleteAnnouncement}>
              <input type="hidden" name="id" value={a.id} />
              <ConfirmButton message="Excluir este aviso?">Excluir</ConfirmButton>
            </form>
          </div>
        ))}
        {!items.length && <p className="m">Nenhum aviso ainda.</p>}
      </section>
    </>
  );
}
