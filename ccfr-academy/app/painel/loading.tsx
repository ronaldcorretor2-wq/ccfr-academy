export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-label="Carregando" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="skel" style={{ height: 40, width: 280 }} />
      <div className="skel" style={{ height: 200 }} />
      <div className="g">
        <div className="skel" style={{ height: 220 }} />
        <div className="skel" style={{ height: 220 }} />
        <div className="skel" style={{ height: 220 }} />
      </div>
    </div>
  );
}
