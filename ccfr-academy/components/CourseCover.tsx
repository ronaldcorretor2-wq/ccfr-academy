const COLORS = [
  { bg: '#283832', fg: '#F7FAF7', sym: 'w' },
  { bg: '#71557F', fg: '#F7FAF7', sym: 'w' },
  { bg: '#E8AD95', fg: '#000000', sym: 'k' },
  { bg: '#C66767', fg: '#000000', sym: 'k' },
  { bg: '#E2D283', fg: '#000000', sym: 'k' },
];

// Sem foto enviada, o curso recebe um bloco de cor da marca, com o título na vertical e o símbolo (como nos cartões do brandbook)
export default function CourseCover({ id, title = '', h = 130, src }: { id: string; title?: string; h?: number; src?: string }) {
  if (src) {
    return (
      <span className="cv" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" style={{ height: h }} />
      </span>
    );
  }
  let s = 0;
  for (const ch of id) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  const k = COLORS[s % COLORS.length];
  const label = (title.trim().split(/\s+/).find((w) => w.length > 3) ?? title).slice(0, 14);
  return (
    <span className="cv" aria-hidden="true" style={{ height: h, background: k.bg, color: k.fg }}>
      <span className="cvlab" style={{ fontSize: Math.max(13, Math.min(22, h / 7)) }}>{label}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="cvsym" src={`/brand/sym_${k.sym}.png`} alt="" />
    </span>
  );
}
