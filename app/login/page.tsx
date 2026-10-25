import { signIn, signUp } from './actions';

export default function Login({ searchParams }: { searchParams: { erro?: string; ok?: string } }) {
  return (
    <div className="center">
      <h1>CCFR Academy</h1>
      {searchParams.erro && <div className="erro" role="alert">{searchParams.erro}</div>}
      {searchParams.ok && <div className="ok" role="status">{searchParams.ok}</div>}
      <form className="pn" action={signIn}>
        <h2>Entrar</h2>
        <label>E-mail<input className="in" name="email" type="email" required autoComplete="email" /></label>
        <label>Senha<input className="in" name="password" type="password" required autoComplete="current-password" /></label>
        <button className="btn" type="submit">Entrar</button>
      </form>
      <form className="pn" action={signUp}>
        <h2>Criar conta</h2>
        <label>Nome completo<input className="in" name="full_name" required /></label>
        <label>E-mail<input className="in" name="email" type="email" required autoComplete="email" /></label>
        <label>Senha (mínimo de 8 caracteres)<input className="in" name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
        <button className="btn" type="submit">Criar conta</button>
      </form>
    </div>
  );
}
