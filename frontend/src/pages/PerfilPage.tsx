import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { isSuperAdmin, useAuth } from '../auth';
import FormAlert from '../components/shared/forms/FormAlert';
import { profileApi } from '../services/api';

const labelClass = 'grid gap-[7px] text-[13px] font-bold text-[#0c1933]';
const inputClass =
  'w-full rounded-[11px] border border-[#e4e9f1] bg-white px-[13px] py-3 outline-none focus:border-[#01317b] focus:shadow-[0_0_0_4px_rgba(1,49,123,0.09)]';

export default function PerfilPage() {
  const { user, refreshUser } = useAuth();
  const [values, setValues] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);
    try {
      if (user.mustChangePassword) {
        await profileApi.setInitialPassword({
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        });
      } else {
        await profileApi.changePassword(values);
      }
      await refreshUser();
      setValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('Contraseña actualizada correctamente.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-width pt-8 pb-20 min-[801px]:pt-[52px]">
      <div className="mb-[42px] flex flex-col items-start justify-between gap-[15px] min-[801px]:flex-row min-[801px]:items-start">
        <div>
          <span className="section-kicker">Cuenta personal</span>
          <h1 className="mt-[10px] mb-[9px] text-[clamp(34px,5vw,54px)] tracking-[-0.06em] text-[#000254]">
            Tu perfil
          </h1>
          <p className="m-0 text-[#627089]">Consulta tus datos y mantén protegida tu cuenta.</p>
        </div>
      </div>

      {user.mustChangePassword && (
        <div className="mb-[18px] flex items-center gap-[14px] rounded-[16px] border border-[#c9d9ef] bg-[#f2f7fd] px-[18px] py-4 text-[#01317b]">
          <ShieldCheck size={20} />
          <div>
            <strong>Primer acceso</strong>
            <p className="mt-[3px] mb-0 text-[12px] text-[#627089]">
              Debes establecer una contraseña personal antes de acceder al resto de la aplicación.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-[18px] min-[801px]:grid-cols-[minmax(230px,0.75fr)_1.25fr]">
        <section className="flex flex-col items-start gap-2.5 rounded-[22px] border border-[#e4e9f1] bg-white p-[27px] shadow-[0_7px_25px_rgba(0,5,84,0.04)]">
          <span className="grid h-[58px] w-[58px] place-items-center rounded-[18px] bg-[#01317b] text-[25px] font-extrabold text-white">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <h2 className="m-0 text-[20px] text-[#000254]">{user.name}</h2>
          <p className="m-0 break-all text-[13px] text-[#627089]">{user.email}</p>
          <span className="role-pill">
            {isSuperAdmin(user) ? 'Superadministrador' : user.role?.name ?? 'Sin cargo asignado'}
          </span>
          {user.role?.description && (
            <p className="m-0 text-xs leading-relaxed text-[#627089]">{user.role.description}</p>
          )}
          <Link
            className="mt-[15px] text-[12px] font-bold text-[#01317b] no-underline"
            to="/gestion"
          >
            Volver al área privada
          </Link>
        </section>

        <section className="rounded-[22px] border border-[#e4e9f1] bg-white p-[27px] shadow-[0_7px_25px_rgba(0,5,84,0.04)]">
          <div className="mb-5 flex items-center gap-[9px] text-[#01317b]">
            <LockKeyhole size={20} />
            <h2 className="m-0 text-[20px] text-[#000254]">Cambiar contraseña</h2>
          </div>

          {message && (
            <div className="mb-4">
              <FormAlert tone="success">{message}</FormAlert>
            </div>
          )}
          {error && (
            <div className="mb-4">
              <FormAlert>{error}</FormAlert>
            </div>
          )}

          <form onSubmit={submit} className="grid gap-4">
            {!user.mustChangePassword && (
              <label className={labelClass}>
                Contraseña actual
                <input
                  type="password"
                  required
                  value={values.currentPassword}
                  onChange={(e) => setValues({ ...values, currentPassword: e.target.value })}
                  className={inputClass}
                />
              </label>
            )}
            <label className={labelClass}>
              Nueva contraseña
              <input
                type="password"
                minLength={15}
                required
                value={values.newPassword}
                onChange={(e) => setValues({ ...values, newPassword: e.target.value })}
                className={inputClass}
              />
              <small className="text-[11px] font-medium text-[#627089]">Mínimo 15 caracteres.</small>
            </label>
            <label className={labelClass}>
              Repetir nueva contraseña
              <input
                type="password"
                minLength={15}
                required
                value={values.confirmPassword}
                onChange={(e) => setValues({ ...values, confirmPassword: e.target.value })}
                className={inputClass}
              />
            </label>
            <button className="button button-primary cursor-pointer" disabled={saving}>
              {saving
                ? 'Guardando…'
                : user.mustChangePassword
                  ? 'Establecer contraseña'
                  : 'Actualizar contraseña'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
