'use client';

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="center">
      <h1>Algo deu errado</h1>
      <p className="m">Não foi possível concluir a ação. Tente de novo; se continuar, avise a equipe da igreja.</p>
      <button className="btn" onClick={() => reset()}>Tentar de novo</button>
    </div>
  );
}
