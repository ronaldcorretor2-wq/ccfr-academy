import { requirePlatform } from '@/lib/ctx';
import { createOrg, masterSetAdmin, masterUpdateOrg } from '../actions';

export default async function Mestre({ searchParams }: { searchParams: { erro?: string; ok?: string } }) {
  const { supabase } = await requirePlatform();
  const { data } = await supabase.rpc('master_list_orgs');
  const orgs: any[] = data ?? [];
  return (
    <>
      <div>
        <h1>Painel mestre</h1>
        <p className="m">Área do dono da plataforma. Aqui você cadastra igrejas, define plano e limite de alunos. Os administradores de cada igreja não têm acesso a esta página.</p>
      </div>
      {searchParams.erro && <div className="erro" role="alert">{searchParams.erro}</div>}
      {searchParams.ok && <div className="ok" role="status">{searchParams.ok}</div>}
      <form className="pn" action={createOrg}>
        <h2>Cadastrar igreja</h2>
        <label>Nome da igreja<input className="in" name="name" required minLength={2} /></label>
        <label>Endereço curto (letras minúsculas, números e hífen)<input className="in" name="slug" required pattern="[a-z0-9\-]{3,40}" /></label>
        <label>E-mail do administrador (ele precisa já ter criado a conta)<input className="in" name="email" type="email" required /></label>
        <button className="btn" type="submit">Cadastrar igreja</button>
      </form>
      {orgs.map((o) => (
        <section className="pn" key={o.id}>
          <h2>{o.name}</h2>
          <p className="m">Endereço: {o.slug} · {Number(o.members)} pessoas · {Number(o.students)} de {o.max_students} alunos · {Number(o.courses)} cursos · plano {o.plan}</p>
          <form className="row" action={masterUpdateOrg}>
            <input type="hidden" name="org_id" value={o.id} />
            <label>Plano<input className="in" name="plan" defaultValue={o.plan} /></label>
            <label>Limite de alunos<input className="in" name="max" type="number" min={0} defaultValue={o.max_students} /></label>
            <button className="b2" type="submit" style={{ alignSelf: 'flex-end' }}>Salvar plano</button>
          </form>
          <form className="row" action={masterSetAdmin}>
            <input type="hidden" name="org_id" value={o.id} />
            <label style={{ flex: 1 }}>Adicionar administrador por e-mail<input className="in" name="email" type="email" required /></label>
            <button className="b2" type="submit" style={{ alignSelf: 'flex-end' }}>Adicionar</button>
          </form>
        </section>
      ))}
      {!orgs.length && <p className="m">Nenhuma igreja cadastrada.</p>}
    </>
  );
}
