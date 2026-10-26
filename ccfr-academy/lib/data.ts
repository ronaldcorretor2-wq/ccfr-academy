export async function loadLearning(supabase: any, userId: string) {
  const [c, m, l, p] = await Promise.all([
    supabase.from('courses').select('id,title,description,status,cover_path').order('created_at'),
    supabase.from('course_modules').select('id,course_id,title,position').order('position'),
    supabase.from('lessons').select('id,course_id,module_id,title,position').order('position'),
    supabase.from('lesson_progress').select('lesson_id,completed,updated_at').eq('user_id', userId),
  ]);
  const courses: any[] = c.data ?? [];
  const modules: any[] = m.data ?? [];
  const lessons: any[] = l.data ?? [];
  const prog: any[] = p.data ?? [];
  const done = new Set<string>(prog.filter((x) => x.completed).map((x) => x.lesson_id as string));
  const mpos = new Map<string, number>(modules.map((x) => [x.id, x.position] as [string, number]));
  const byCourse: Record<string, any[]> = {};
  for (const x of lessons) (byCourse[x.course_id] ??= []).push(x);
  for (const k of Object.keys(byCourse)) {
    byCourse[k].sort((a, b) => ((mpos.get(a.module_id) ?? 0) - (mpos.get(b.module_id) ?? 0)) || (a.position - b.position));
  }
  const last = [...prog].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))[0];
  return { courses, modules, lessons, byCourse, done, last };
}

export function embedUrl(u: string | null) {
  if (!u) return null;
  const m = u.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export function youtubeId(u: string | null) {
  if (!u) return null;
  const m = u.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

// Pré-requisito: numa trilha publicada, um curso só abre depois de concluir os anteriores.
export async function prerequisiteFor(supabase: any, courseId: string, byCourse: Record<string, any[]>, done: Set<string>, courses: any[]): Promise<string | null> {
  const { data } = await supabase
    .from('learning_path_courses')
    .select('path_id,course_id,position,learning_paths!inner(status)')
    .eq('learning_paths.status', 'published');
  const rows: any[] = data ?? [];
  for (const r of rows.filter((x) => x.course_id === courseId)) {
    for (const p of rows.filter((x) => x.path_id === r.path_id && x.position < r.position)) {
      const prev = courses.find((c: any) => c.id === p.course_id);
      if (!prev) continue;
      const ls = byCourse[p.course_id] ?? [];
      if (!(ls.length > 0 && ls.every((l: any) => done.has(l.id)))) return prev.title as string;
    }
  }
  return null;
}

// Endereços temporários das fotos de capa (arquivos privados)
export async function signCovers(supabase: any, courses: any[]): Promise<Record<string, string>> {
  const withCover = courses.filter((c: any) => c.cover_path);
  const out: Record<string, string> = {};
  if (!withCover.length) return out;
  const { data } = await supabase.storage.from('materiais').createSignedUrls(withCover.map((c: any) => c.cover_path as string), 3600);
  const byPath = new Map<string, string>();
  for (const x of (data ?? []) as any[]) if (x.path && x.signedUrl) byPath.set(x.path as string, x.signedUrl as string);
  for (const c of withCover) {
    const u = byPath.get(c.cover_path as string);
    if (u) out[c.id as string] = u;
  }
  return out;
}
