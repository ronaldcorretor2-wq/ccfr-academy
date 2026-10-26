import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { siteOrigin } from '@/lib/origin';

// Recebe o link do e-mail (confirmação de conta ou recuperação de senha) e abre a sessão.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/painel';
  const safe = next.startsWith('/') && !next.startsWith('//') ? next : '/painel';
  const base = siteOrigin();
  if (code) {
    const { error } = await createClient().auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safe, base));
  }
  return NextResponse.redirect(new URL('/login?erro=' + encodeURIComponent('O link é inválido ou expirou. Peça um novo.'), base));
}
