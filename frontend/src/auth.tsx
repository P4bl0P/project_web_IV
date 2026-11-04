/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
export type User = { id: string; email: string; name: string; isSuperAdmin: boolean; mustChangePassword?: boolean; role?: { name: string } };
type LoginResponse = { status: 'MFA_REQUIRED' | 'MFA_SETUP_REQUIRED'; challenge: string; setup?: { secret: string; otpauthUrl: string } };
type AuthContextValue = { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<LoginResponse>; completeMfa: (challenge: string, code: string, setup: boolean) => Promise<string[]>; refreshUser: () => Promise<void>; logout: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

async function request(path: string, options: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Inténtalo de nuevo.');
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = Array.isArray(data.message) ? data.message.join(' · ') : data.message;
    throw new Error(typeof message === 'string' ? message : 'No se pudo completar la operación');
  }
  return response.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const refreshSession = async () => {
      try {
        const nextUser = await request('/auth/me');
        if (!cancelled) setUser(nextUser);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void refreshSession();
    const interval = window.setInterval(() => { void refreshSession(); }, 60000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, []);
  const refreshUser = async () => { setUser(await request('/auth/me')); };
  const login = (email: string, password: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase(), password }) });
  const completeMfa = async (challenge: string, code: string, setup: boolean) => {
    const result = await request(setup ? '/auth/mfa/confirm-setup' : '/auth/mfa', { method: 'POST', body: JSON.stringify({ challenge, code: code.trim() }) });
    setUser(await request('/auth/me'));
    return result.recoveryCodes ?? [];
  };
  const logout = async () => { await request('/auth/logout', { method: 'POST' }); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, login, completeMfa, refreshUser, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be used inside AuthProvider'); return value; }
export function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth(); const location = useLocation();
  if (loading) return <div className="state-card">Comprobando sesión…</div>;
  if (user?.mustChangePassword && location.pathname !== '/perfil') return <Navigate to="/perfil" replace />;
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="state-card">Comprobando permisos…</div>;
  return user?.isSuperAdmin ? children : <Navigate to="/gestion" replace />;
}
export function LoginPage() {
  const { user, login, completeMfa } = useAuth(); const navigate = useNavigate();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState(''); const [setup, setSetup] = useState<LoginResponse['setup']>(); const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]); const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (user) return <Navigate to="/gestion" replace />;
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setSubmitting(true);
    try { const result = await login(email, password); setChallenge(result.challenge); setSetup(result.setup); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo iniciar sesión'); }
    finally { setSubmitting(false); }
  }
  async function verify(event: React.FormEvent) {
    event.preventDefault(); setError(''); setSubmitting(true);
    try { const codes = await completeMfa(challenge, code, Boolean(setup)); if (codes.length) setRecoveryCodes(codes); else navigate(setup ? '/perfil' : '/gestion'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Código no válido'); }
    finally { setSubmitting(false); }
  }
  if (recoveryCodes.length) return <main className="auth-page page-width"><div className="auth-card"><span className="section-kicker">MFA configurado</span><h1>Guarda tus códigos</h1><p className="auth-error">Se muestran una sola vez. Guárdalos en un lugar seguro.</p><pre className="recovery-codes">{recoveryCodes.join('\n')}</pre><button className="button button-primary" type="button" onClick={() => navigate('/gestion')}>Continuar</button></div></main>;
  return <main className="auth-page page-width"><div className="auth-card"><span className="section-kicker">Área privada</span><h1>{challenge ? 'Verificación en dos pasos' : 'Acceso del equipo'}</h1>{error && <p className="auth-error" role="alert">{error}</p>}{!challenge ? <form onSubmit={submit}><label>Correo electrónico<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Contraseña<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="button button-primary" type="submit" disabled={submitting}>{submitting ? 'Comprobando…' : 'Continuar'}</button></form> : <form onSubmit={verify}>{setup && <div className="mfa-setup"><strong>Configura tu aplicación autenticadora</strong><p>Escanea este URI con Google Authenticator, Microsoft Authenticator o 2FAS:</p><code>{setup.otpauthUrl}</code></div>}<label>Código temporal<input inputMode="numeric" pattern="[0-9]{6}" required value={code} onChange={(event) => setCode(event.target.value)} /></label><button className="button button-primary" type="submit" disabled={submitting}>{submitting ? 'Verificando…' : 'Entrar'}</button></form>}</div></main>;
}
