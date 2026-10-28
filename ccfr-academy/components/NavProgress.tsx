'use client';
import { Suspense, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Barra fina no topo que acende assim que a pessoa clica num link interno
function Inner() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const key = `${pathname}?${sp.toString()}`;
  const [busy, setBusy] = useState(false);

  useEffect(() => { setBusy(false); }, [key]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest('a');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href') ?? '';
      if (!href.startsWith('/') || href.startsWith('//')) return;
      if (href === window.location.pathname + window.location.search) return;
      setBusy(true);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (!busy) return;
    const t = setTimeout(() => setBusy(false), 8000);
    return () => clearTimeout(t);
  }, [busy]);

  return busy ? <div className="navbar" role="progressbar" aria-label="Carregando página" /> : null;
}

export default function NavProgress() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
