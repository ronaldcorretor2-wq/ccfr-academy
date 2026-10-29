import SubmitButton from '@/components/SubmitButton';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { getCtx } from '@/lib/ctx';
import NavItem from '@/components/NavItem';
import ThemeToggle from '@/components/ThemeToggle';
import { publicLogo } from '@/lib/logo';
import { signOut } from './actions';

const I = {
  home: 'M3 11l9-8 9 8v10H3z',
  book: 'M4 4h16v16H4zM9 4v16',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  route: 'M4 18l5-6 4 3 7-9',
  award: 'M12 2a6 6 0 100 12 6 6 0 000-12zM8 13l-2 9 4-2 4 2-2-9',
  notice: 'M4 5h16v11H8l-4 4zM8 9h8M8 12h5',
  admin: 'M4 20l4-1 11-11-3-3L5 16z',
  master: 'M12 9a3 3 0 100 6 3 3 0 000-6zM12 2v3M12 19v3M2 12h3M19 12h3',
};

export default async function PainelLayout({ children }: { children: ReactNode }) {
  const { supabase, user, member, isStaff } = await getCtx();
  const { data: pa } = await supabase.rpc('is_platform_admin');
  const { count: unread } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('read_at', null);
  const initial = (String(user.user_metadata?.full_name ?? user.email ?? 'A').trim()[0] ?? 'A').toUpperCase();
  const logo = member?.logoPath ? publicLogo(member.logoPath) : null;
  return (
    <div className="shell">
      <nav className="sb" aria-label="Principal">
        <div className="lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={logo ? 'lgfull lginv' : 'lgfull'} src={logo ?? '/brand/lock_w.png'} alt="CCFR" />
          <span>Academy · {member?.orgName ?? ''}</span>
        </div>
        <NavItem href="/painel" d={I.home} exact>Início</NavItem>
        <NavItem href="/painel/meus-cursos" d={I.book}>Meus cursos</NavItem>
        <NavItem href="/painel/catalogo" d={I.grid}>Catálogo</NavItem>
        <NavItem href="/painel/trilhas" d={I.route}>Trilhas</NavItem>
        <NavItem href="/painel/certificados" d={I.award}>Certificados</NavItem>
        <NavItem href="/painel/avisos" d={I.notice}>Avisos</NavItem>
        {isStaff && <NavItem href="/painel/admin" d={I.admin}>Administração</NavItem>}
        {pa === true && <NavItem href="/painel/mestre" d={I.master}>Painel mestre</NavItem>}
        <div className="sbfoot">
          <ThemeToggle />
          <form action={signOut}><SubmitButton className="b2">Sair</SubmitButton></form>
        </div>
      </nav>
      <main className="mn">
        <div className="topbar">
          <form action="/painel/buscar" method="get" role="search" className="search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5" /></svg>
            <input name="q" placeholder="Buscar cursos e aulas" aria-label="Buscar cursos e aulas" />
          </form>
          <div className="row" style={{ gap: 16 }}>
            <Link href="/painel/notificacoes" className="bell" aria-label={unread ? `Notificações: ${unread} novas` : 'Notificações'}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9zM13.7 21a2 2 0 01-3.4 0" /></svg>
              {unread ? <i className="dot" /> : null}
            </Link>
            <span className="avatar" aria-hidden="true">{initial}</span>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
