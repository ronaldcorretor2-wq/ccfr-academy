import Link from 'next/link';
import CourseCover from '@/components/CourseCover';

export default function CourseCard({ c, pct, cover, fav }: { c: any; pct: number; cover?: string; fav?: boolean }) {
  return (
    <Link href={`/painel/cursos/${c.id}`} className="ccard">
      <CourseCover id={c.id} title={c.title} h={150} src={cover} />
      <h3>{c.title}</h3>
      {(fav || c.status !== 'published') && (
        <div className="row" style={{ gap: 6 }}>
          {fav && <span className="tag y">Favorito</span>}
          {c.status !== 'published' && <span className="tag">Rascunho</span>}
        </div>
      )}
      <div className="bar"><i style={{ width: `${pct}%` }} /></div>
      <p className="m" style={{ fontSize: 12 }}>{pct}% concluído</p>
    </Link>
  );
}
