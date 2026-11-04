import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth';
import { profileApi } from '../services/api';

export default function PerfilPage() {
  const { user, refreshUser } = useAuth();
  const [values, setValues] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  if (!user) return null;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage(''); setError(''); setSaving(true);
    try {
      if (user.mustChangePassword) {
        await profileApi.setInitialPassword({ newPassword: values.newPassword, confirmPassword: values.confirmPassword });
      } else {
        await profileApi.changePassword(values);
      }
      await refreshUser();
      setValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('Contraseña actualizada. Las sesiones anteriores han quedado invalidadas.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo cambiar la contraseña'); }
    finally { setSaving(false); }
  };
  return <div className="page-width profile-page">
    <div className="page-heading"><div><span className="section-kicker">Cuenta personal</span><h1>Tu perfil</h1><p>Consulta tus datos y mantén protegida tu cuenta.</p></div></div>
    {user.mustChangePassword && <div className="notice-card"><ShieldCheck size={20} /><div><strong>Primer acceso</strong><p>Debes establecer una contraseña personal antes de acceder al resto de la aplicación.</p></div></div>}
    <div className="profile-grid">
      <section className="surface-card profile-summary"><span className="profile-avatar">{user.name.slice(0, 1).toUpperCase()}</span><h2>{user.name}</h2><p>{user.email}</p><span className="role-pill">{user.isSuperAdmin ? 'SUPER_ADMIN' : user.role?.name ?? 'Sin cargo'}</span><Link className="text-link" to="/gestion">Volver al área privada</Link></section>
      <section className="surface-card"><div className="card-title"><LockKeyhole size={20} /><h2>Cambiar contraseña</h2></div>
        {message && <p className="success-message" role="status">{message}</p>}{error && <p className="auth-error" role="alert">{error}</p>}
        <form onSubmit={submit} className="profile-form">
          {!user.mustChangePassword && <label>Contraseña actual<input type="password" required value={values.currentPassword} onChange={(e) => setValues({ ...values, currentPassword: e.target.value })} /></label>}
          <label>Nueva contraseña<input type="password" minLength={15} required value={values.newPassword} onChange={(e) => setValues({ ...values, newPassword: e.target.value })} /><small>Mínimo 15 caracteres.</small></label>
          <label>Repetir nueva contraseña<input type="password" minLength={15} required value={values.confirmPassword} onChange={(e) => setValues({ ...values, confirmPassword: e.target.value })} /></label>
          <button className="button button-primary" disabled={saving}>{saving ? 'Guardando…' : user.mustChangePassword ? 'Establecer contraseña' : 'Actualizar contraseña'}</button>
        </form>
      </section>
    </div>
  </div>;
}
