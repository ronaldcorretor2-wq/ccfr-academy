import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CourseCover from '@/components/CourseCover';

export default async function CatalogoPublico({ params }: { params: { slug: string } }) {
  const { data } = await createClient().rpc('public_catalog', { p_slug: params.slug });
  if (!data) notFound();
  const c: any = data;
  const courses: any[] = c.courses ?? [];
  return (
    <div className="mn" style={{ margin: '0 auto' }}>
      <div>
        <p className="m">CCFR Academy</p>
        <h1>{c.name}</h1>
        <p className="m">Cursos de formação disponíveis. Para estudar, crie sua conta ou entre.</p>
      </div>
      <div className="row">
        <Link className="btn" href={`/login?igreja=${encodeURIComponent(c.slug)}`}>Entrar ou criar conta</Link>
      </div>
      <div className="g">
        {courses.map((x) => (
          <article key={x.id} className="pn">
            <CourseCover id={x.id} h={110} />
            <h3>{x.title}</h3>
            <p className="m">{x.description}</p>
          </article>
        ))}
      </div>
      {!courses.length && <p className="m">Nenhum curso publicado ainda.</p>}
    </div>
  );
}
