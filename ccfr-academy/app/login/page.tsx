import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { publicLogo } from '@/lib/logo';
import { signIn, signUp } from './actions';

type SP = { erro?: string; ok?: string; igreja?: string; aba?: string };

export default async function Login({ searchParams }: { searchParams: SP }) {
  const slug = (searchParams.igreja ?? process.env.IGREJA_PADRAO ?? '').trim().toLowerCase();
  let church: any = null;
  if (slug) {
    const { data } = await createClient().rpc('church_branding', { p_slug: slug });
    church = data;
  }
  const criar = searchParams.aba === 'criar';
  const tab = (aba: string) => `/login?aba=${aba}${searchParams.igreja ? `&igreja=${encodeURIComponent(searchParams.igreja)}` : ''}`;
  return (
    <div className="center">
      <div className="brand">
        {church?.logo_path ? <img src={publicLogo(church.logo_path)} alt={church.name} /> : <i className="mono">CCFR</i>}
        <h1 style={{ margin: 0, fontSize: 26 }}>{church?.name ?? 'CCFR Academy'}</h1>
        <p className="m">Plataforma de formação cristã</p>
      </div>
      <div className="tabs" role="tablist">
        <Link href={tab('entrar')} className={criar ? '' : 'on'} role="tab" aria-selected={!criar}>Entrar</Link>
        <Link href={tab('criar')} className={criar ? 'on' : ''} role="tab" aria-selected={criar}>Criar conta</Link>
      </div>
      {searchParams.erro && <div className="erro" role="alert">{searchParams.erro}</div>}
      {searchParams.ok && <div className="ok" role="status">{searchParams.ok}</div>}
      {criar ? (
        <form className="pn" action={signUp}>
          <label>Nome completo<input className="in" name="full_name" required autoComplete="name" /></label>
          <label>E-mail<input className="in" name="email" type="email" required autoComplete="email" /></label>
          <label>Senha (mínimo de 8 caracteres)<input className="in" name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
          {church ? (
            <>
              <input type="hidden" name="church_slug" value={church.slug} />
              <p className="m">Você vai entrar na igreja <strong>{church.name}</strong>.</p>
            </>
          ) : (
            <label>Endereço da sua igreja (peça à sua igreja)<input className="in" name="church_slug" placeholder="ex.: ccfr" /></label>
          )}
          <button className="btn" type="submit">Criar conta</button>
        </form>
      ) : (
        <form className="pn" action={signIn}>
          <label>E-mail<input className="in" name="email" type="email" required autoComplete="email" /></label>
          <label>Senha<input className="in" name="password" type="password" required autoComplete="current-password" /></label>
          <button className="btn" type="submit">Entrar</button>
          <Link className="m" href="/recuperar">Esqueci minha senha</Link>
        </form>
      )}
    </div>
  );
}
