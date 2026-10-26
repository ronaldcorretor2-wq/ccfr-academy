import Link from 'next/link';
import { redirect } from 'next/navigation';
import CourseCover from '@/components/CourseCover';
import { getCtx } from '@/lib/ctx';
import { loadLearning, signCovers } from '@/lib/data';
import { joinOrg } from './actions';

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
    const { data: pa } = await supabase.rpc('is_platform_admin');
    return (
      <>
        <h1>Bem-vindo à CCFR Academy</h1>
        <p className="m">Para começar, entre na sua igreja usando o endereço que ela passou para você.</p>
        {pa === true && <Link className="btn" href="/painel/mestre">Abrir o painel mestre</Link>}
        {searchParams.erro && <div className="erro" role="alert">{searchParams.erro}</div>}
        <form className="pn" action={joinOrg}>
          <h2>Entrar numa igreja</h2>
          <label>Endereço da igreja (ex.: ccfr)<input className="in" name="slug" required /></label>
          <button className="btn" type="submit">Entrar na igreja</button>
        </form>
      </>
    );
  }

  const { courses, byCourse, done, last } = await loadLearning(supabase, user.id);
  const covers = await signCovers(supabase, courses);
  const { data: av } = await supabase.from('announcements').select('id,title,body,created_at').order('created_at', { ascending: false }).limit(3);
  const notices: any[] = av ?? [];
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
        <section className="hero">
          <div className="txt">
            <span className="tag" style={{ alignSelf: 'flex-start' }}>Continue de onde parou</span>
            <h2 style={{ fontSize: 28, margin: 0 }}>{continueTitle}</h2>
            <Link className="btn" href={`/painel/aula/${continueId}`}>Continuar aula</Link>
          </div>
          <div className="art">{startCourse && <CourseCover id={startCourse} h={240} src={covers[startCourse]} />}</div>
        </section>
      )}
      {notices.length > 0 && (
        <section className="pn">
          <h2>Avisos da igreja</h2>
          {notices.map((n: any) => (
            <div className="li" key={n.id} style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h3>{n.title}</h3>
                {n.body && <p className="m" style={{ whiteSpace: 'pre-wrap' }}>{n.body}</p>}
              </div>
              <span className="m">{new Date(n.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
          ))}
        </section>
      )}
      <section>
        <h2>Cursos</h2>
        <div className="g">
          {ordered.map((c) => (
            <Link key={c.id} href={`/painel/cursos/${c.id}`} className="pn" style={{ textDecoration: 'none' }}>
              <CourseCover id={c.id} h={110} src={covers[c.id]} />
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
