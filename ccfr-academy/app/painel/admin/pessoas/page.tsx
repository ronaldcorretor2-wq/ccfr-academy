import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireStaff } from '@/lib/ctx';
import ConfirmButton from '@/components/ConfirmButton';
import { removeMember, setRole } from '../../actions';

const nomes: Record<string, string> = { admin: 'Administrador', teacher: 'Professor', student: 'Aluno' };

export default async function Pessoas({ searchParams }: { searchParams: { erro?: string; ok?: string } }) {
  const { supabase, member, user } = await requireStaff();
  if (member.role !== 'admin') redirect('/painel/admin');
  const { data } = await supabase
    .from('organization_members')
    .select('user_id, role, joined_at, profiles(full_name)')
    .eq('org_id', member.orgId)
    .order('joined_at');
  const people: any[] = data ?? [];
  const nameOf = (x: any) => (Array.isArray(x.profiles) ? x.profiles[0]?.full_name : x.profiles?.full_name) || 'Sem nome';
  return (
    <>
      <div>
        <Link className="m" href="/painel/admin">Voltar à administração</Link>
        <h1>Pessoas</h1>
        <p className="m">Quem entra pelo endereço da igreja começa como aluno. Aqui você promove alguém a professor ou administrador.</p>
      </div>
      {searchParams.erro && <div className="erro" role="alert">{searchParams.erro}</div>}
      {searchParams.ok && <div className="ok" role="status">{searchParams.ok}</div>}
      <section className="pn">
        {people.map((p) => (
          <div className="li" key={p.user_id}>
            <span style={{ flex: 1 }}>{nameOf(p)}{p.user_id === user.id ? ' (você)' : ''}</span>
            {p.user_id === user.id ? (
              <span className="tag">{nomes[p.role]}</span>
            ) : (
              <>
                <form className="row" action={setRole}>
                  <input type="hidden" name="user_id" value={p.user_id} />
                  <select className="in" name="role" defaultValue={p.role} style={{ width: 'auto' }}>
                    <option value="student">Aluno</option>
                    <option value="teacher">Professor</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <button className="b2" type="submit">Alterar</button>
                </form>
                <form action={removeMember}>
                  <input type="hidden" name="user_id" value={p.user_id} />
                  <ConfirmButton message="Remover esta pessoa da igreja? Ela perde o acesso aos cursos.">Remover</ConfirmButton>
                </form>
              </>
            )}
          </div>
        ))}
        {!people.length && <p className="m">Nenhuma pessoa ainda.</p>}
      </section>
    </>
  );
}
