import SubmitButton from '@/components/SubmitButton';
import type { ReactNode } from 'react';
import { getCtx } from '@/lib/ctx';
import NavItem from '@/components/NavItem';
import ThemeToggle from '@/components/ThemeToggle';
import { publicLogo } from '@/lib/logo';
import { signOut } from './actions';

const I = {
  home: 'M3 11l9-8 9 8v10H3z',
  paths: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  cert: 'M4 4h16v16H4zM9 4v16',
  admin: 'M4 20l4-1 11-11-3-3L5 16z',
  bell: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9zM13.7 21a2 2 0 01-3.4 0',
  master: 'M12 9a3 3 0 100 6 3 3 0 000-6zM12 2v3M12 19v3M2 12h3M19 12h3',
};

export default async function PainelLayout({ children }: { children: ReactNode }) {
  const { supabase, user, member, isStaff } = await getCtx();
  const { data: pa } = await supabase.rpc('is_platform_admin');
  const { count: unread } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('read_at', null);
  const logo = member?.logoPath ? publicLogo(member.logoPath) : null;
  return (
    <div className="shell">
      <nav className="sb" aria-label="Principal">
        <div className="lg">
          {logo ? <img className="lgimg" src={logo} alt="" /> : <i>CCFR</i>}
          <div><b>Academy</b><span>{member?.orgName ?? ''}</span></div>
        </div>
        <NavItem href="/painel" d={I.home} exact>Início</NavItem>
        <NavItem href="/painel/trilhas" d={I.paths}>Trilhas</NavItem>
        <NavItem href="/painel/notificacoes" d={I.bell}>Notificações{unread ? <span className="tag" style={{ marginLeft: 6 }}>{unread}</span> : null}</NavItem>
        <NavItem href="/painel/certificados" d={I.cert}>Certificados</NavItem>
        {isStaff && <NavItem href="/painel/admin" d={I.admin}>Administração</NavItem>}
        {pa === true && <NavItem href="/painel/mestre" d={I.master}>Painel mestre</NavItem>}
        <div className="sbfoot">
          <ThemeToggle />
          <form action={signOut}><SubmitButton className="b2">Sair</SubmitButton></form>
        </div>
      </nav>
      <main className="mn">{children}</main>
    </div>
  );
}
