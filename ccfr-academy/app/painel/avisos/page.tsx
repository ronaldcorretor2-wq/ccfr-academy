import Link from 'next/link';
import { getCtx } from '@/lib/ctx';

export default async function Avisos() {
  const { supabase, isStaff } = await getCtx();
  const { data } = await supabase.from('announcements').select('id,title,body,created_at').order('created_at', { ascending: false }).limit(50);
  const items: any[] = data ?? [];
  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1>Avisos</h1>
          <p className="m">Comunicados da sua igreja.</p>
        </div>
        {isStaff && <Link className="b2" href="/painel/admin/avisos">Gerenciar avisos</Link>}
      </div>
      <section className="pn">
        {items.map((a) => (
          <div className="li" key={a.id} style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h3>{a.title}</h3>
              {a.body && <p className="m" style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{a.body}</p>}
            </div>
            <span className="m">{new Date(a.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
        ))}
        {!items.length && <p className="m">Nenhum aviso por enquanto.</p>}
      </section>
    </>
  );
}
