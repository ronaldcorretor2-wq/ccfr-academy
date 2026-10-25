import Link from 'next/link';
import { requireStaff } from '@/lib/ctx';

export default async function Relatorios() {
  const { supabase } = await requireStaff();
  const [{ data: cs }, { data: en }, { data: ls }, { data: pr }, { data: ce }] = await Promise.all([
    supabase.from('courses').select('id,title,status').order('created_at'),
    supabase.from('enrollments').select('course_id,user_id'),
    supabase.from('lessons').select('id,course_id'),
    supabase.from('lesson_progress').select('lesson_id,user_id').eq('completed', true),
    supabase.from('certificates').select('course_id'),
  ]);
  const courses: any[] = cs ?? [];
  const enrollments: any[] = en ?? [];
  const lessons: any[] = ls ?? [];
  const progress: any[] = pr ?? [];
  const certs: any[] = ce ?? [];
  const courseOf = new Map<string, string>(lessons.map((l: any) => [l.id, l.course_id] as [string, string]));
  const rows = courses.map((c) => {
    const total = lessons.filter((l: any) => l.course_id === c.id).length;
    const students = enrollments.filter((e: any) => e.course_id === c.id).map((e: any) => e.user_id as string);
    const doneBy: Record<string, number> = {};
    for (const p of progress) if (courseOf.get(p.lesson_id) === c.id) doneBy[p.user_id] = (doneBy[p.user_id] ?? 0) + 1;
    const pcts = students.map((u) => (total ? Math.min(100, Math.round(((doneBy[u] ?? 0) / total) * 100)) : 0));
    return {
      id: c.id as string,
      title: c.title as string,
      enrolled: students.length,
      finished: pcts.filter((p) => p === 100).length,
      avg: pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0,
      certificates: certs.filter((x: any) => x.course_id === c.id).length,
    };
  });
  return (
    <>
      <div>
        <Link className="m" href="/painel/admin">Voltar à administração</Link>
        <h1>Relatórios</h1>
        <p className="m">Resumo por curso. Para ver aluno por aluno, abra o curso em Administração.</p>
      </div>
      <section className="pn">
        {rows.map((r) => (
          <div className="li" key={r.id} style={{ flexWrap: 'wrap' }}>
            <Link href={`/painel/admin/cursos/${r.id}`}>{r.title}</Link>
            <span className="m">{r.enrolled} matriculados · {r.finished} concluíram · média {r.avg}% · {r.certificates} certificados</span>
          </div>
        ))}
        {!rows.length && <p className="m">Nenhum curso ainda.</p>}
      </section>
    </>
  );
}
