import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireStaff } from '@/lib/ctx';

const ENTIDADE: Record<string, string> = { courses: 'um curso', organization_members: 'uma pessoa', learning_paths: 'uma trilha', certificates: 'um certificado', organizations: 'a igreja' };
const ACAO: Record<string, string> = { INSERT: 'criou', UPDATE: 'alterou', DELETE: 'excluiu' };

export default async function Auditoria() {
  const { supabase, member } = await requireStaff();
  if (member.role !== 'admin') redirect('/painel/admin');
  const { data } = await supabase
    .from('audit_logs')
    .select('id,created_at,action,entity,details,profiles(full_name)')
    .eq('org_id', member.orgId)
    .order('created_at', { ascending: false })
    .limit(100);
  const logs: any[] = data ?? [];
  const who = (x: any) => (Array.isArray(x.profiles) ? x.profiles[0]?.full_name : x.profiles?.full_name) || 'Sistema';
  return (
    <>
      <div>
        <Link className="m" href="/painel/admin">Voltar à administração</Link>
        <h1>Registro de ações</h1>
        <p className="m">As 100 ações mais recentes. Este registro é gravado pelo banco de dados e não pode ser editado pelo site.</p>
      </div>
      <section className="pn">
        {logs.map((l) => (
          <div className="li" key={l.id} style={{ flexWrap: 'wrap' }}>
            <span>{who(l)} {ACAO[l.action] ?? l.action} {ENTIDADE[l.entity] ?? l.entity}{l.details?.resumo ? `: ${l.details.resumo}` : ''}</span>
            <span className="m">{new Date(l.created_at).toLocaleString('pt-BR')}</span>
          </div>
        ))}
        {!logs.length && <p className="m">Nenhuma ação registrada ainda.</p>}
      </section>
    </>
  );
}
