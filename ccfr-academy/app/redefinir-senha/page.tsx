import SubmitButton from '@/components/SubmitButton';
import { updatePassword } from '../login/actions';

export default function Redefinir({ searchParams }: { searchParams: { erro?: string } }) {
  return (
    <div className="center">
      <h1>Nova senha</h1>
      {searchParams.erro && <div className="erro" role="alert">{searchParams.erro}</div>}
      <form className="pn" action={updatePassword}>
        <label>Nova senha (mínimo de 8 caracteres)<input className="in" name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
        <SubmitButton className="btn">Salvar nova senha</SubmitButton>
      </form>
    </div>
  );
}
