'use client';
import { useState, type ReactNode } from 'react';

export default function Tabs({ tabs, initial }: { tabs: { id: string; label: string; content: ReactNode }[]; initial?: string }) {
  const [cur, setCur] = useState(initial && tabs.some((t) => t.id === initial) ? initial : tabs[0].id);
  return (
    <div>
      <div className="chips" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={cur === t.id} className={cur === t.id ? 'chipb on' : 'chipb'} onClick={() => setCur(t.id)}>{t.label}</button>
        ))}
      </div>
      <div role="tabpanel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{tabs.find((t) => t.id === cur)?.content}</div>
    </div>
  );
}
