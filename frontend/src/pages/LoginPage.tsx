import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth, type LoginResponse } from '../auth';
import FormAlert from '../components/shared/forms/FormAlert';
import FormField from '../components/shared/forms/FormField';
import { formInputClass } from '../components/shared/forms/formStyles';

export default function LoginPage() {
  const { user, login, completeMfa } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState('');
  const [setup, setSetup] = useState<LoginResponse['setup']>();
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user && !recoveryCodes.length) return <Navigate to="/gestion" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await login(email, password);
      setChallenge(result.challenge);
      setSetup(result.setup);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const codes = await completeMfa(challenge, code, Boolean(setup));
      if (codes.length) setRecoveryCodes(codes);
      else navigate(setup ? '/perfil' : '/gestion');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Código no válido');
    } finally {
      setSubmitting(false);
    }
  }

  const cardClass =
    'w-[min(460px,100%)] rounded-[24px] border border-[#e4e9f1] bg-white p-[38px] shadow-[0_18px_50px_rgba(0,5,84,0.09)]';

  if (recoveryCodes.length) {
    return (
      <main className="page-width grid min-h-[calc(100vh-76px)] place-items-center pt-10 pb-[70px]">
        <div className={cardClass}>
          <span className="section-kicker">MFA configurado</span>
          <h1 className="mt-3 mb-[25px] text-[34px] tracking-[-0.05em] text-[#000254]">
            Guarda tus códigos
          </h1>
          <FormAlert tone="info">Se muestran una sola vez. Guárdalos en un lugar seguro.</FormAlert>
          <pre className="my-[18px] rounded-[12px] bg-[#f5f7fb] p-4 text-center font-mono text-[14px] font-bold leading-[1.8] text-[#000254]">
            {recoveryCodes.join('\n')}
          </pre>
          <button
            className="button button-primary cursor-pointer"
            type="button"
            onClick={() => navigate(user?.mustChangePassword ? '/perfil' : '/gestion')}
          >
            Continuar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page-width grid min-h-[calc(100vh-76px)] place-items-center pt-10 pb-[70px]">
      <div className={cardClass}>
        <span className="section-kicker">Área privada</span>
        <h1 className="mt-3 mb-[25px] text-[34px] tracking-[-0.05em] text-[#000254]">
          {challenge ? 'Verificación en dos pasos' : 'Acceso del equipo'}
        </h1>
        {error && (
          <div className="mb-4">
            <FormAlert>{error}</FormAlert>
          </div>
        )}
        {!challenge ? (
          <form onSubmit={submit} className="grid gap-[18px]">
            <FormField label="Correo electrónico" required>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={formInputClass()}
              />
            </FormField>
            <FormField label="Contraseña" required>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={formInputClass()}
              />
            </FormField>
            <button className="button button-primary cursor-pointer" type="submit" disabled={submitting}>
              {submitting ? 'Comprobando…' : 'Continuar'}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="grid gap-[18px]">
            {setup && (
              <div className="rounded-[12px] bg-[#f5f7fb] p-[14px] text-[12px] leading-[1.5] text-[#627089]">
                <strong className="text-[#000254]">Configura tu aplicación autenticadora</strong>
                <p>Escanea este URI con Google Authenticator, Microsoft Authenticator o 2FAS:</p>
                <code className="mt-2 block break-all text-[10px] text-[#01317b]">
                  {setup.otpauthUrl}
                </code>
              </div>
            )}
            <FormField label="Código temporal o de recuperación" required>
              <input
                inputMode="text"
                autoComplete="one-time-code"
                minLength={6}
                maxLength={20}
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className={formInputClass()}
              />
              <small className="mt-1 block text-[11px] text-[#627089]">
                Introduce los 6 dígitos de tu app autenticadora o uno de tus códigos de recuperación.
              </small>
            </FormField>
            <button className="button button-primary cursor-pointer" type="submit" disabled={submitting}>
              {submitting ? 'Verificando…' : 'Entrar'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
