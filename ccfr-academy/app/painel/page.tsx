import SubmitButton from '@/components/SubmitButton';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import CourseCard from '@/components/CourseCard';
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
          <SubmitButton className="btn">Entrar na igreja</SubmitButton>
        </form>
      </>
    );
  }

  const { courses, byCourse, done, last } = await loadLearning(supabase, user.id);
  const covers = await signCovers(supabase, courses);
  const { data: av } = await supabase.from('announcements').select('id,title,body,created_at').order('created_at', { ascending: false }).limit(1);
  const notice: any = (av ?? [])[0] ?? null;
  const { count: certCount } = await supabase.from('certificates').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
  const { data: fv } = await supabase.from('favorites').select('course_id').eq('user_id', user.id);
  const favs = new Set<string>(((fv ?? []) as any[]).map((x: any) => x.course_id as string));
  const pct = (id: string) => {
    const ls = byCourse[id] ?? [];
    return ls.length ? Math.round((ls.filter((l) => done.has(l.id)).length / ls.length) * 100) : 0;
  };

  const hora = Number(new Date().toLocaleString('pt-BR', { hour: 'numeric', hour12: false, timeZone: 'America/Sao_Paulo' })) % 24;
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const nome = String(user.user_metadata?.full_name ?? '').split(' ')[0];

  const lastLesson = last && Object.values(byCourse).flat().find((l) => l.id === last.lesson_id);
  const startCourse = lastLesson ? lastLesson.course_id : courses.find((c) => (byCourse[c.id] ?? []).length)?.id;
  const startTitle = courses.find((c) => c.id === startCourse)?.title ?? '';
  const pending: any[] = startCourse ? (byCourse[startCourse] ?? []).filter((l) => !done.has(l.id)) : [];
  const next = pending[0];

  const ordered = [...courses].sort((a, b) => Number(favs.has(b.id)) - Number(favs.has(a.id)));
  const andamento = ordered.filter((c) => pct(c.id) > 0 && pct(c.id) < 100).slice(0, 4);
  const novos = ordered.filter((c) => pct(c.id) === 0);

  return (
    <div className="dash">
      <div className="dmain">
        <div>
          <h1 style={{ fontSize: 48 }}>{saudacao}{nome ? `, ${nome}` : ''}</h1>
          <p className="m">Vivendo o Reino em Família.</p>
        </div>
        {next && startCourse && (
          <section className="hero">
            <div className="txt">
              <span className="cap">Continue estudando</span>
              <h2>{startTitle}</h2>
              <p className="m">Próxima aula: {next.title}</p>
              <div className="bar" style={{ maxWidth: 320 }}><i style={{ width: `${pct(startCourse)}%` }} /></div>
              <p className="m" style={{ fontSize: 12 }}>{pct(startCourse)}% concluído · faltam {pending.length} {pending.length === 1 ? 'aula' : 'aulas'}</p>
              <SubmitLink href={`/painel/aula/${next.id}`}>Continuar aula</SubmitLink>
            </div>
            <div className="art">{/* eslint-disable-next-line @next/next/no-img-element */}<img className="heroimg" src={covers[startCourse] || '/brand/foto-hero.jpg'} alt="" /></div>
          </section>
        )}
        {andamento.length > 0 && (
          <section>
            <h2>Em andamento</h2>
            <div className="ccards">{andamento.map((c) => <CourseCard key={c.id} c={c} pct={pct(c.id)} cover={covers[c.id]} fav={favs.has(c.id)} />)}</div>
          </section>
        )}
        {novos.length > 0 && (
          <section>
            <h2>Cursos disponíveis</h2>
            <div className="ccards">{novos.map((c) => <CourseCard key={c.id} c={c} pct={0} cover={covers[c.id]} fav={favs.has(c.id)} />)}</div>
          </section>
        )}
        {!courses.length && <p className="m">Ainda não há cursos publicados na sua igreja.</p>}
      </div>
      <aside className="dside">
        <section className="pn">
          <h2 style={{ marginBottom: 0 }}>Próximas aulas</h2>
          {pending.slice(0, 3).map((l: any, i: number) => (
            <Link key={l.id} href={`/painel/aula/${l.id}`} className="li" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, textDecoration: 'none' }}>
              <span style={{ fontWeight: 500, fontSize: 13.5 }}>{l.title}</span>
              <span className="m" style={{ fontSize: 12 }}>{i === 0 ? 'Próxima' : 'Depois'} · {startTitle}</span>
            </Link>
          ))}
          {!pending.length && <p className="m">Nenhuma aula pendente por enquanto.</p>}
        </section>
        <section className="sidecard y">
          <span className="cap">Certificados</span>
          {certCount ? (
            <>
              <h3 style={{ fontSize: 20, fontWeight: 500 }}>Você tem {certCount} {certCount === 1 ? 'certificado' : 'certificados'}</h3>
              <Link href="/painel/certificados" style={{ fontWeight: 700 }}>Ver certificados</Link>
            </>
          ) : (
            <h3 style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.35 }}>Seu primeiro certificado chega ao concluir um curso.</h3>
          )}
        </section>
        {notice && (
          <section className="sidecard p">
            <span className="cap">Aviso da igreja</span>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>{notice.title}</h3>
            {notice.body && <p className="m" style={{ whiteSpace: 'pre-wrap' }}>{String(notice.body).slice(0, 140)}</p>}
            <Link href="/painel/avisos" style={{ fontWeight: 700 }}>Ver todos os avisos</Link>
          </section>
        )}
      </aside>
    </div>
  );
}

function SubmitLink({ href, children }: { href: string; children: string }) {
  return <Link className="btn" href={href}>{children}</Link>;
}
