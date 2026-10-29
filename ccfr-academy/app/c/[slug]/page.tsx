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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="blogo" src="/brand/lock_k.png" alt="CCFR" style={{ height: 30, width: 'auto', marginBottom: 20 }} />
        <h1>{c.name}</h1>
        <p className="m">Cursos de formação disponíveis. Para estudar, crie sua conta ou entre.</p>
      </div>
      <div className="row">
        <Link className="btn" href={`/login?igreja=${encodeURIComponent(c.slug)}`}>Entrar ou criar conta</Link>
      </div>
      <div className="g">
        {courses.map((x) => (
          <article key={x.id} className="pn">
            <CourseCover id={x.id} title={x.title} h={120} />
            <h3>{x.title}</h3>
            <p className="m">{x.description}</p>
          </article>
        ))}
      </div>
      {!courses.length && <p className="m">Nenhum curso publicado ainda.</p>}
    </div>
  );
}
