import './globals.css';
import type { ReactNode } from 'react';
import NavProgress from '@/components/NavProgress';

export const metadata = { title: 'CCFR Academy', description: 'Plataforma de formação cristã' };

const themeScript = "try{var t=localStorage.getItem('tema');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@500;600;700&family=Hanken+Grotesk:wght@400;500;700&display=swap" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <NavProgress />
        {children}
      </body>
    </html>
  );
}
