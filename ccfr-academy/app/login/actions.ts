'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { siteOrigin } from '@/lib/origin';

const go = (k: 'erro' | 'ok', msg: string) => redirect(`/login?${k}=${encodeURIComponent(msg)}`);

export async function signIn(fd: FormData) {
  const { error } = await createClient().auth.signInWithPassword({
    email: String(fd.get('email') ?? '').trim(),
    password: String(fd.get('password') ?? ''),
  });
  if (error) go('erro', 'E-mail ou senha incorretos.');
  redirect('/painel');
}

export async function signUp(fd: FormData) {
  const password = String(fd.get('password') ?? '');
  if (password.length < 8) go('erro', 'A senha precisa ter pelo menos 8 caracteres.');
  const { data, error } = await createClient().auth.signUp({
    email: String(fd.get('email') ?? '').trim(),
    password,
    options: { emailRedirectTo: `${siteOrigin()}/auth/callback?next=/painel`, data: { full_name: String(fd.get('full_name') ?? '').trim(), church_slug: String(fd.get('church_slug') ?? '').trim().toLowerCase() } },
  });
  if (error) go('erro', 'Não foi possível criar a conta. Confira os dados e tente de novo.');
  if (data.session) redirect('/painel');
  go('ok', 'Conta criada. Confirme pelo link enviado ao seu e-mail e depois entre.');
}

export async function requestReset(fd: FormData) {
  await createClient().auth.resetPasswordForEmail(String(fd.get('email') ?? '').trim(), {
    redirectTo: `${siteOrigin()}/auth/callback?next=/redefinir-senha`,
  });
  go('ok', 'Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha.');
}

export async function updatePassword(fd: FormData) {
  const password = String(fd.get('password') ?? '');
  const back = (msg: string) => redirect(`/redefinir-senha?erro=${encodeURIComponent(msg)}`);
  if (password.length < 8) back('A senha precisa ter pelo menos 8 caracteres.');
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) go('erro', 'O link expirou. Peça um novo na tela de recuperação de senha.');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) back('Não foi possível salvar a nova senha. Peça um novo link e tente de novo.');
  redirect('/painel');
}
