import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getCtx } from '@/lib/ctx';
import PrintButton from '@/components/PrintButton';

export default async function Certificado({ params }: { params: { id: string } }) {
  const { supabase } = await getCtx();
  const { data: c } = await supabase.from('certificates').select('code,student_name,course_title,org_name,issued_at').eq('id', params.id).maybeSingle();
  if (!c) notFound();
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? '';
  const code = String(c.code).match(/.{1,4}/g)?.join('-') ?? c.code;
  return (
    <>
      <Link className="m no-print" href="/painel/certificados">Voltar aos certificados</Link>
      <section className="cert">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="certlogo" src="/brand/word_k.png" alt="CCFR" />
        <p className="certcap">{String(c.org_name).toUpperCase()}</p>
        <p className="certcap" style={{ marginTop: 18 }}>CERTIFICADO DE CONCLUSÃO</p>
        <p className="m">Certificamos que</p>
        <h1 className="certname">{c.student_name}</h1>
        <p className="m">concluiu com aproveitamento o curso</p>
        <h2 className="certcourse">{c.course_title}</h2>
        <p className="m">em {new Date(c.issued_at).toLocaleDateString('pt-BR')}</p>
        <div className="certband">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/sym_w.png" alt="" />
          <div>
            <strong>Verificação pública</strong><br />
            Código: {code}<br />
            https://{host}/verificar/{code}
          </div>
          <em>Vivendo o Reino<br />em Família.</em>
        </div>
      </section>
      <p className="m no-print" style={{ fontSize: 12 }}>Certificado de formação oferecido pela instituição. Não é diploma acadêmico oficial.</p>
      <PrintButton />
    </>
  );
}
