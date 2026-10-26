'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Result = { ok: boolean; msg?: string };

export default function UploadResource({ lessonId, orgId, register }: {
  lessonId: string;
  orgId: string;
  register: (lessonId: string, title: string, kind: string, path: string, size: number) => Promise<Result>;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get('file') as File | null;
    const title = String(fd.get('title') ?? '').trim();
    if (!file || !file.size) { setMsg('Escolha um arquivo.'); return; }
    if (file.size > 50 * 1024 * 1024) { setMsg('O arquivo passa de 50 MB.'); return; }
    const isPdf = file.type === 'application/pdf';
    if (!isPdf && !file.type.startsWith('audio/')) { setMsg('Envie um PDF ou um arquivo de áudio.'); return; }
    setBusy(true);
    setMsg('Enviando... não feche esta página.');
    const safe = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-');
    const path = `${orgId}/${lessonId}/${crypto.randomUUID()}-${safe}`;
    const { error } = await createClient().storage.from('materiais').upload(path, file, { contentType: file.type });
    if (error) { setBusy(false); setMsg('Não foi possível enviar o arquivo. Confira o tipo e o tamanho e tente de novo.'); return; }
    const r = await register(lessonId, title || file.name, isPdf ? 'pdf' : 'audio', path, file.size);
    setBusy(false);
    if (!r.ok) { setMsg(r.msg ?? 'Não foi possível registrar o arquivo.'); return; }
    form.reset();
    setMsg('Arquivo enviado.');
    router.refresh();
  }

  return (
    <form className="pn" onSubmit={onSubmit} style={{ background: 'var(--soft)' }}>
      <h3>Enviar PDF ou áudio (até 50 MB)</h3>
      <label>Título (opcional)<input className="in" name="title" disabled={busy} /></label>
      <label>Arquivo<input className="in" type="file" name="file" accept="application/pdf,audio/*" required disabled={busy} /></label>
      <button className="btn" type="submit" disabled={busy}>{busy ? 'Enviando...' : 'Enviar arquivo'}</button>
      {busy && <progress aria-label="Enviando arquivo" />}
      {msg && <p className="m" role="status">{msg}</p>}
    </form>
  );
}
