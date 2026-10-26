import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireStaff } from '@/lib/ctx';
import UploadLogo from '@/components/UploadLogo';
import { saveLogo, updateOrgName } from '../../actions';

export default async function Configuracoes({ searchParams }: { searchParams: { erro?: string; ok?: string } }) {
  const { member } = await requireStaff();
  if (member.role !== 'admin') redirect('/painel/admin');
  return (
    <>
      <div>
        <Link className="m" href="/painel/admin">Voltar à administração</Link>
        <h1>Configurações da igreja</h1>
        <p className="m">Plano e limite de alunos são definidos pelo painel mestre.</p>
      </div>
      {searchParams.erro && <div className="erro" role="alert">{searchParams.erro}</div>}
      {searchParams.ok && <div className="ok" role="status">{searchParams.ok}</div>}
      <form className="pn" action={updateOrgName}>
        <h2>Nome</h2>
        <label>Nome da igreja<input className="in" name="name" defaultValue={member.orgName} required minLength={2} /></label>
        <button className="btn" type="submit">Salvar nome</button>
      </form>
      <UploadLogo orgId={member.orgId} save={saveLogo} />
    </>
  );
}
