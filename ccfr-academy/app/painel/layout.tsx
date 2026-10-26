import Link from 'next/link';
import type { ReactNode } from 'react';
import { getCtx } from '@/lib/ctx';
import { signOut } from './actions';

export default async function PainelLayout({ children }: { children: ReactNode }) {
  const { supabase, member, isStaff } = await getCtx();
  const { data: pa } = await supabase.rpc('is_platform_admin');
  return (
    <div className="shell">
      <nav className="sb" aria-label="Principal">
        <div className="logo">CCFR Academy</div>
        {member && <p className="m" style={{ marginBottom: 16 }}>{member.orgName}</p>}
        <Link href="/painel">Início</Link>
        <Link href="/painel/trilhas">Trilhas</Link>
        <Link href="/painel/certificados">Certificados</Link>
        {isStaff && <Link href="/painel/admin">Administração</Link>}
        {pa === true && <Link href="/painel/mestre">Painel mestre</Link>}
        <form action={signOut} style={{ marginTop: 'auto' }}><button className="b2" type="submit">Sair</button></form>
      </nav>
      <main className="mn">{children}</main>
    </div>
  );
}
