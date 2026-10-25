import './globals.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'CCFR Academy', description: 'Plataforma de formação cristã' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
