'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export default function NavItem({ href, d, exact, children }: { href: string; d: string; exact?: boolean; children: ReactNode }) {
  const p = usePathname();
  const on = exact ? p === href : p === href || p.startsWith(href + '/');
  return (
    <Link href={href} className={on ? 'on' : ''}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>
      {children}
    </Link>
  );
}
