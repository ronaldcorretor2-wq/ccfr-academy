import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const { data: { user } } = await createClient().auth.getUser();
  if (user) redirect('/painel');
  return (
    <div className="center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="blogo" src="/brand/lock_k.png" alt="CCFR" style={{ height: 30, width: 'auto', alignSelf: 'flex-start' }} />
      <h1>CCFR Academy</h1>
      <p className="m">Plataforma de formação cristã da Comunidade Cristã Família e Reino.</p>
      <Link className="btn" href="/login">Entrar ou criar conta</Link>
    </div>
  );
}
