import SubmitButton from '@/components/SubmitButton';
import Link from 'next/link';
import { requestReset } from '../login/actions';

export default function Recuperar() {
  return (
    <div className="center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="blogo" src="/brand/lock_k.png" alt="CCFR" style={{ height: 30, width: 'auto', alignSelf: 'flex-start' }} />
      <h1>Recuperar senha</h1>
      <p className="m">Digite o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.</p>
      <form className="pn" action={requestReset}>
        <label>E-mail<input className="in" name="email" type="email" required autoComplete="email" /></label>
        <SubmitButton className="btn">Enviar link</SubmitButton>
      </form>
      <Link className="m" href="/login">Voltar ao login</Link>
    </div>
  );
}
