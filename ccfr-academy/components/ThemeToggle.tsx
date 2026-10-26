'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [t, setT] = useState('dark');
  useEffect(() => { setT(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'); }, []);
  const flip = () => {
    const n = t === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', n);
    try { localStorage.setItem('tema', n); } catch {}
    setT(n);
  };
  return <button type="button" className="b2" onClick={flip}>{t === 'dark' ? 'Tema claro' : 'Tema escuro'}</button>;
}
