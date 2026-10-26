import type { ReactNode } from 'react';

const SHADES = ['#1F1F1F', '#2B2B2B', '#3A3A3A', '#232323', '#333333', '#161616'];

// Capa provisória em padrão geométrico (cada curso recebe sempre o mesmo desenho). Trocar por foto depois.
export default function CourseCover({ id, h = 130, src }: { id: string; h?: number; src?: string }) {
  if (src) {
    return (
      <span className="cv" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" style={{ display: 'block', width: '100%', height: h, objectFit: 'cover' }} />
      </span>
    );
  }
  let s = 0;
  for (const ch of id) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  const kind = s % 6;
  const bg = SHADES[(s >> 3) % SHADES.length];
  const line = { stroke: '#fff', strokeOpacity: 0.28, fill: 'none' } as const;
  const rng = (n: number, step: number, from = 0) => Array.from({ length: n }, (_, i) => from + i * step);
  let art: ReactNode = null;
  if (kind === 0) art = rng(9, 28, 30).map((r) => <circle key={r} cx={240} cy={130} r={r} {...line} />);
  if (kind === 1) art = rng(19, 22).map((x) => <line key={x} x1={x} y1={0} x2={x - 60} y2={130} {...line} />);
  if (kind === 2) art = [30, 110, 190].map((x) => <path key={x} d={`M${x} 130V70a40 40 0 0 1 80 0V130`} {...line} />);
  if (kind === 3) art = rng(7, 18, 10).map((y) => <rect key={y} x={0} y={y} width={300 - y * 2} height={8} fill="#fff" fillOpacity={0.14} />);
  if (kind === 4) art = rng(13, 40, -100).map((x) => <line key={x} x1={150} y1={140} x2={x} y2={0} {...line} />);
  if (kind === 5) art = rng(12, 24, 14).flatMap((x) => rng(5, 24, 14).map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r={2} fill="#fff" fillOpacity={0.4} />));
  return (
    <span className="cv" aria-hidden="true">
      <svg viewBox="0 0 300 130" preserveAspectRatio="xMidYMid slice" style={{ height: h }}>
        <rect width="300" height="130" fill={bg} />
        {art}
      </svg>
    </span>
  );
}
