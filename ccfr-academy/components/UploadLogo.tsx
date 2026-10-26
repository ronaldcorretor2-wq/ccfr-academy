'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function UploadLogo({ orgId, save }: { orgId: string; save: (path: string) => Promise<{ ok: boolean; msg?: string }> }) {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const file = new FormData(form).get('file') as File | null;
    if (!file || !file.size) { setMsg('Escolha uma imagem.'); return; }
    if (file.size > 2 * 1024 * 1024) { setMsg('A imagem passa de 2 MB.'); return; }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setMsg('Use uma imagem PNG, JPG ou WEBP.'); return; }
    setBusy(true);
    setMsg('Enviando...');
    const safe = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-');
    const path = `${orgId}/logo/${crypto.randomUUID()}-${safe}`;
    const { error } = await createClient().storage.from('materiais').upload(path, file, { contentType: file.type });
    if (error) { setBusy(false); setMsg('Não foi possível enviar a imagem.'); return; }
    const r = await save(path);
    setBusy(false);
    if (!r.ok) { setMsg(r.msg ?? 'Não foi possível salvar o logotipo.'); return; }
    form.reset();
    setMsg('Logotipo atualizado.');
    router.refresh();
  }

  return (
    <form className="pn" onSubmit={onSubmit}>
      <h2>Logotipo</h2>
      <label>Imagem (PNG, JPG ou WEBP, até 2 MB)<input className="in" type="file" name="file" accept="image/png,image/jpeg,image/webp" required disabled={busy} /></label>
      <button className="btn" type="submit" disabled={busy}>{busy ? 'Enviando...' : 'Enviar logotipo'}</button>
      {msg && <p className="m" role="status">{msg}</p>}
    </form>
  );
}
