export async function loadLearning(supabase: any, userId: string) {
  const [c, m, l, p] = await Promise.all([
    supabase.from('courses').select('id,title,description,status').order('created_at'),
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
