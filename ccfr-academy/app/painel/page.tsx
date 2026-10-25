import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCtx } from '@/lib/ctx';
import { loadLearning } from '@/lib/data';
import { createOrg, joinOrg } from './actions';

export default async function Painel({ searchParams }: { searchParams: { erro?: string } }) {
  const { supabase, user, member } = await getCtx();

  if (!member) {
    const slug = String(user.user_metadata?.church_slug ?? '').trim();
    if (slug) {
      const { error } = await supabase.rpc('join_organization', { p_slug: slug });
      if (!error) redirect('/painel');
    }
  }

  if (!member) {
    return (
      <>
        <h1>Bem-vindo à CCFR Academy</h1>
        <p className="m">Para começar, entre na sua igreja ou cadastre uma nova.</p>
        {searchParams.erro && <div className="erro" role="alert">{searchParams.erro}</div>}
        <form className="pn" action={joinOrg}>
          <h2>Entrar numa igreja</h2>
          <label>Endereço da igreja (ex.: ccfr)<input className="in" name="slug" required /></label>
          <button className="btn" type="submit">Entrar na igreja</button>
        </form>
        <form className="pn" action={createOrg}>
          <h2>Cadastrar uma nova igreja</h2>
          <label>Nome da igreja<input className="in" name="name" required minLength={2} /></label>
          <label>Endereço curto (letras minúsculas, números e hífen)<input className="in" name="slug" required pattern="[a-z0-9\-]{3,40}" /></label>
          <button className="btn" type="submit">Cadastrar igreja</button>
        </form>
      </>
    );
  }

  const { courses, byCourse, done, last } = await loadLearning(supabase, user.id);
  const { data: fv } = await supabase.from('favorites').select('course_id').eq('user_id', user.id);
  const favs = new Set<string>(((fv ?? []) as any[]).map((x: any) => x.course_id as string));
  const ordered = [...courses].sort((a, b) => Number(favs.has(b.id)) - Number(favs.has(a.id)));
  const pct = (id: string) => {
    const ls = byCourse[id] ?? [];
    return ls.length ? Math.round((ls.filter((l) => done.has(l.id)).length / ls.length) * 100) : 0;
  };

  let continueId: string | null = null;
  let continueTitle = '';
  const lastLesson = last && Object.values(byCourse).flat().find((l) => l.id === last.lesson_id);
  const startCourse = lastLesson ? lastLesson.course_id : courses.find((c) => (byCourse[c.id] ?? []).length)?.id;
  if (startCourse) {
    const next = (byCourse[startCourse] ?? []).find((l) => !done.has(l.id));
    if (next) { continueId = next.id; continueTitle = `${courses.find((c) => c.id === startCourse)?.title}: ${next.title}`; }
  }

  return (
    <>
      <div>
        <h1>Olá, {String(user.user_metadata?.full_name ?? '').split(' ')[0] || 'bem-vindo'}</h1>
        <p className="m">{courses.length ? 'Escolha um curso para estudar.' : 'Ainda não há cursos publicados na sua igreja.'}</p>
      </div>
      {continueId && (
        <section className="pn">
          <span className="tag" style={{ alignSelf: 'flex-start' }}>Continue de onde parou</span>
          <h2>{continueTitle}</h2>
          <Link className="btn" href={`/painel/aula/${continueId}`}>Continuar aula</Link>
        </section>
      )}
      <section>
        <h2>Cursos</h2>
        <div className="g">
          {ordered.map((c) => (
            <Link key={c.id} href={`/painel/cursos/${c.id}`} className="pn" style={{ textDecoration: 'none' }}>
              <h3>{c.title}</h3>
              {favs.has(c.id) && <span className="tag" style={{ alignSelf: 'flex-start' }}>Favorito</span>}
              {c.status !== 'published' && <span className="tag" style={{ alignSelf: 'flex-start' }}>Rascunho (só equipe vê)</span>}
              <p className="m">{c.description}</p>
              <div className="bar"><i style={{ width: `${pct(c.id)}%` }} /></div>
              <p className="m">{pct(c.id)}% concluído</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
