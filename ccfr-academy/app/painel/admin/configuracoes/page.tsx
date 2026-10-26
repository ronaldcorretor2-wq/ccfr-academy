import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireStaff } from '@/lib/ctx';
import UploadLogo from '@/components/UploadLogo';
import { siteOrigin } from '@/lib/origin';
import { saveLogo, togglePublicCatalog, updateOrgName } from '../../actions';

export default async function Configuracoes({ searchParams }: { searchParams: { erro?: string; ok?: string } }) {
  const { supabase, member } = await requireStaff();
  if (member.role !== 'admin') redirect('/painel/admin');
  const { data: org } = await supabase.from('organizations').select('slug,public_catalog').eq('id', member.orgId).single();
  const pub = org?.public_catalog === true;
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
      <section className="pn">
        <h2>Catálogo público</h2>
        <p className="m">Quando ligado, qualquer pessoa pode ver os títulos e descrições dos cursos publicados, sem login.</p>
        {pub && <p className="m">Endereço público: {siteOrigin()}/c/{org?.slug}</p>}
        <form action={togglePublicCatalog}>
          <input type="hidden" name="value" value={pub ? 'off' : 'on'} />
          <button className="btn" type="submit">{pub ? 'Desligar catálogo público' : 'Ligar catálogo público'}</button>
        </form>
      </section>
      <UploadLogo orgId={member.orgId} save={saveLogo} />
    </>
  );
}
