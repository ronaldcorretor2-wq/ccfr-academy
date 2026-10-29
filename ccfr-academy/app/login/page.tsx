import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { publicLogo } from '@/lib/logo';
import SubmitButton from '@/components/SubmitButton';
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
  const custom = church?.logo_path ? publicLogo(church.logo_path) : null;
  return (
    <div className="auth">
      <div className="authl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={custom ?? '/brand/lock_w.png'} alt={church?.name ?? 'CCFR'} style={{ height: 36, width: 'auto', alignSelf: 'flex-start', filter: custom ? 'brightness(0) invert(1)' : undefined }} />
        <div>
          <p className="slogan">Vivendo o Reino<br />em Família.</p>
          <p className="m" style={{ color: '#C6C7C7', marginTop: 18 }}>{church?.name ?? 'Comunidade Cristã Família e Reino'}</p>
        </div>
      </div>
      <div className="authr">
        <div className="authbox">
          <div>
            <h1>Bem-vindo</h1>
            <p className="m">Entre ou crie sua conta para continuar.</p>
          </div>
          <div className="tabs" role="tablist">
            <Link href={tab('entrar')} className={criar ? '' : 'on'} role="tab" aria-selected={!criar}>Entrar</Link>
            <Link href={tab('criar')} className={criar ? 'on' : ''} role="tab" aria-selected={criar}>Criar conta</Link>
          </div>
          {searchParams.erro && <div className="erro" role="alert">{searchParams.erro}</div>}
          {searchParams.ok && <div className="ok" role="status">{searchParams.ok}</div>}
          {criar ? (
            <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }} action={signUp}>
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
              <SubmitButton className="btn">Criar conta</SubmitButton>
            </form>
          ) : (
            <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }} action={signIn}>
              <label>E-mail<input className="in" name="email" type="email" required autoComplete="email" /></label>
              <label>Senha<input className="in" name="password" type="password" required autoComplete="current-password" /></label>
              <SubmitButton className="btn">Entrar</SubmitButton>
              <Link className="m" href="/recuperar">Esqueci minha senha</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
