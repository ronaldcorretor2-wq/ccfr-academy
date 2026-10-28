'use client';
import * as ReactDOM from 'react-dom';
import type { CSSProperties, ReactNode } from 'react';

// useFormStatus informa se o formulário está sendo enviado (ação em andamento)
const useStatus: () => { pending: boolean } = (ReactDOM as any).useFormStatus ?? (() => ({ pending: false }));

export default function SubmitButton({ children, className = 'btn', style, pendingText = 'Aguarde...' }: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  pendingText?: string;
}) {
  const { pending } = useStatus();
  return (
    <button type="submit" className={className} style={style} disabled={pending} aria-busy={pending}>
      {pending ? (<><span className="spin" aria-hidden="true" />{pendingText}</>) : children}
    </button>
  );
}
