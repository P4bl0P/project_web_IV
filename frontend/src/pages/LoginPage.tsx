import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth, type LoginResponse } from '../auth';
import FormAlert from '../components/shared/forms/FormAlert';
import FormField from '../components/shared/forms/FormField';
import { formInputClass } from '../components/shared/forms/formStyles';

type LoginFieldErrors = {
  email?: string;
  password?: string;
  code?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { user, login, completeMfa } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState('');
  const [setup, setSetup] = useState<LoginResponse['setup']>();
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(''), 5000);
    return () => window.clearTimeout(timer);
  }, [error]);

  if (user && !recoveryCodes.length) return <Navigate to="/gestion" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');

    const nextErrors: LoginFieldErrors = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      nextErrors.email = 'Introduce tu correo electrónico.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      nextErrors.email = 'Introduce un correo electrónico válido.';
    }

    if (!password) {
      nextErrors.password = 'Introduce tu contraseña.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
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

    const nextErrors: LoginFieldErrors = {};
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      nextErrors.code = 'Introduce el código temporal o de recuperación.';
    } else if (trimmedCode.length < 6) {
      nextErrors.code = 'El código debe tener al menos 6 caracteres.';
    } else if (trimmedCode.length > 20) {
      nextErrors.code = 'El código no puede superar los 20 caracteres.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
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
          <form onSubmit={submit} noValidate className="grid gap-[18px]">
            <FormField label="Correo electrónico" required error={fieldErrors.email}>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                className={formInputClass(Boolean(fieldErrors.email))}
              />
            </FormField>
            <FormField label="Contraseña" required error={fieldErrors.password}>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                className={formInputClass(Boolean(fieldErrors.password))}
              />
            </FormField>
            <button className="button button-primary cursor-pointer" type="submit" disabled={submitting}>
              {submitting ? 'Comprobando…' : 'Continuar'}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} noValidate className="grid gap-[18px]">
            {setup && (
              <div className="rounded-[12px] bg-[#f5f7fb] p-[14px] text-[12px] leading-[1.5] text-[#627089]">
                <strong className="text-[#000254]">Configura tu aplicación autenticadora</strong>
                <p>Escanea este URI con Google Authenticator, Microsoft Authenticator o 2FAS:</p>
                <code className="mt-2 block break-all text-[10px] text-[#01317b]">
                  {setup.otpauthUrl}
                </code>
              </div>
            )}
            <FormField
              label="Código temporal o de recuperación"
              required
              hint="Introduce los 6 dígitos de tu app autenticadora o uno de tus códigos de recuperación."
              error={fieldErrors.code}
            >
              <input
                inputMode="text"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  if (fieldErrors.code) {
                    setFieldErrors((prev) => ({ ...prev, code: undefined }));
                  }
                }}
                className={formInputClass(Boolean(fieldErrors.code))}
              />
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
