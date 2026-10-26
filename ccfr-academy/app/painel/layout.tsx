import type { ReactNode } from 'react';
import { getCtx } from '@/lib/ctx';
import NavItem from '@/components/NavItem';
import ThemeToggle from '@/components/ThemeToggle';
import { signOut } from './actions';

const I = {
  home: 'M3 11l9-8 9 8v10H3z',
  paths: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  cert: 'M4 4h16v16H4zM9 4v16',
  admin: 'M4 20l4-1 11-11-3-3L5 16z',
  master: 'M12 9a3 3 0 100 6 3 3 0 000-6zM12 2v3M12 19v3M2 12h3M19 12h3',
};

export default async function PainelLayout({ children }: { children: ReactNode }) {
  const { supabase, member, isStaff } = await getCtx();
  const { data: pa } = await supabase.rpc('is_platform_admin');
  let logoUrl: string | null = null;
  if (member?.logoPath) {
    const { data } = await supabase.storage.from('materiais').createSignedUrl(member.logoPath, 3600);
    logoUrl = data?.signedUrl ?? null;
  }
  return (
    <div className="shell">
      <nav className="sb" aria-label="Principal">
        <div className="lg">
          {logoUrl ? <img className="lgimg" src={logoUrl} alt="" /> : <i>CCFR</i>}
          <div><b>Academy</b><span>{member?.orgName ?? ''}</span></div>
        </div>
        <NavItem href="/painel" d={I.home} exact>Início</NavItem>
        <NavItem href="/painel/trilhas" d={I.paths}>Trilhas</NavItem>
        <NavItem href="/painel/certificados" d={I.cert}>Certificados</NavItem>
        {isStaff && <NavItem href="/painel/admin" d={I.admin}>Administração</NavItem>}
        {pa === true && <NavItem href="/painel/mestre" d={I.master}>Painel mestre</NavItem>}
        <div className="sbfoot">
          <ThemeToggle />
          <form action={signOut}><button className="b2" type="submit">Sair</button></form>
        </div>
      </nav>
      <main className="mn">{children}</main>
    </div>
  );
}
