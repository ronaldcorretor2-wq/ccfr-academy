'use client';
import * as ReactDOM from 'react-dom';
import type { ReactNode } from 'react';

const useStatus: () => { pending: boolean } = (ReactDOM as any).useFormStatus ?? (() => ({ pending: false }));

export default function ConfirmButton({ message, children, className }: { message: string; children: ReactNode; className?: string }) {
  const { pending } = useStatus();
  return (
    <button type="submit" className={className ?? 'b2'} disabled={pending} aria-busy={pending} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      {pending ? (<><span className="spin" aria-hidden="true" />Aguarde...</>) : children}
    </button>
  );
}
