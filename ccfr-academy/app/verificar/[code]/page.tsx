import { createClient } from '@/lib/supabase/server';

export default async function Verificar({ params }: { params: { code: string } }) {
  const { data } = await createClient().rpc('verify_certificate', { p_code: decodeURIComponent(params.code) });
  const c: any = data;
  return (
    <div className="center">
      <h1>Verificação de certificado</h1>
      {c ? (
        <div className="ok" role="status">
          <p style={{ margin: 0 }}><strong>Certificado válido.</strong></p>
          <p style={{ margin: '8px 0 0' }}>{c.student_name} concluiu o curso {c.course_title}, de {c.org_name}, em {new Date(c.issued_at).toLocaleDateString('pt-BR')}.</p>
        </div>
      ) : (
        <div className="erro" role="alert">Nenhum certificado encontrado com este código. Confira se digitou corretamente.</div>
      )}
    </div>
  );
}
