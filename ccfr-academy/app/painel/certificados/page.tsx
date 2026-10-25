import Link from 'next/link';
import { getCtx } from '@/lib/ctx';

export default async function Certificados() {
  const { supabase, user } = await getCtx();
  const { data } = await supabase.from('certificates').select('id,course_title,issued_at').eq('user_id', user.id).order('issued_at', { ascending: false });
  const certs: any[] = data ?? [];
  return (
    <>
      <h1>Meus certificados</h1>
      <section className="pn">
        {certs.map((c) => (
          <div className="li" key={c.id}>
            <Link href={`/painel/certificados/${c.id}`}>{c.course_title}</Link>
            <span className="m">{new Date(c.issued_at).toLocaleDateString('pt-BR')}</span>
          </div>
        ))}
        {!certs.length && <p className="m">Nenhum certificado ainda. Conclua todas as aulas de um curso para emitir o primeiro.</p>}
      </section>
    </>
  );
}
