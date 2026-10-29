'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [t, setT] = useState('light');
  useEffect(() => { setT(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'); }, []);
  const flip = () => {
    const n = t === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', n);
    try { localStorage.setItem('tema', n); } catch {}
    setT(n);
  };
  return <button type="button" className="b2" onClick={flip}>{t === 'light' ? 'Tema escuro' : 'Tema claro'}</button>;
}
