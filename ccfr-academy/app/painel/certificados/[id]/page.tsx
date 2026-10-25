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
        <p className="m">{c.org_name}</p>
        <h1>Certificado de conclusão</h1>
        <p className="m">Certificamos que</p>
        <h2 style={{ fontSize: 28 }}>{c.student_name}</h2>
        <p className="m">concluiu o curso</p>
        <h2 style={{ fontSize: 22 }}>{c.course_title}</h2>
        <p className="m">em {new Date(c.issued_at).toLocaleDateString('pt-BR')}</p>
        <p className="m" style={{ marginTop: 16 }}>Código de verificação: <strong>{code}</strong></p>
        <p className="m">Confira em https://{host}/verificar/{code}</p>
        <p className="m" style={{ fontSize: 12 }}>Certificado de formação oferecido pela instituição. Não é diploma acadêmico oficial.</p>
      </section>
      <PrintButton />
    </>
  );
}
