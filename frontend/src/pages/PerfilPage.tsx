import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { isSuperAdmin, useAuth } from '../auth';
import FormAlert from '../components/shared/forms/FormAlert';
import FormField from '../components/shared/forms/FormField';
import { formInputClass } from '../components/shared/forms/formStyles';
import { profileApi } from '../services/api';

type PasswordFieldErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export default function PerfilPage() {
  const { user, refreshUser } = useAuth();
  const [values, setValues] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState<PasswordFieldErrors>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(''), 5000);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(''), 5000);
    return () => window.clearTimeout(timer);
  }, [error]);

  if (!user) return null;

  const validate = (): PasswordFieldErrors => {
    const nextErrors: PasswordFieldErrors = {};

    if (!user.mustChangePassword && !values.currentPassword) {
      nextErrors.currentPassword = 'Introduce tu contraseña actual.';
    }

    if (!values.newPassword) {
      nextErrors.newPassword = 'Introduce la nueva contraseña.';
    } else if (values.newPassword.length < 15) {
      nextErrors.newPassword = 'La contraseña debe tener al menos 15 caracteres.';
    } else if (values.newPassword.length > 128) {
      nextErrors.newPassword = 'La contraseña no puede superar los 128 caracteres.';
    } else if (values.newPassword.trim().length < 12) {
      nextErrors.newPassword = 'La contraseña no puede estar compuesta solo por espacios.';
    } else if (
      !user.mustChangePassword &&
      values.currentPassword &&
      values.newPassword === values.currentPassword
    ) {
      nextErrors.newPassword = 'La nueva contraseña debe ser diferente de la actual.';
    }

    if (!values.confirmPassword) {
      nextErrors.confirmPassword = 'Debes repetir la nueva contraseña.';
    } else if (values.newPassword && values.confirmPassword !== values.newPassword) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    return nextErrors;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setFieldErrors({});
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
      setFieldErrors({});
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

          <form onSubmit={submit} noValidate className="grid gap-4">
            {!user.mustChangePassword && (
              <FormField label="Contraseña actual" required error={fieldErrors.currentPassword}>
                <input
                  type="password"
                  value={values.currentPassword}
                  onChange={(e) => {
                    setValues({ ...values, currentPassword: e.target.value });
                    if (fieldErrors.currentPassword) {
                      setFieldErrors((prev) => ({ ...prev, currentPassword: undefined }));
                    }
                  }}
                  className={formInputClass(Boolean(fieldErrors.currentPassword))}
                />
              </FormField>
            )}
            <FormField
              label="Nueva contraseña"
              required
              hint="Mínimo 15 caracteres."
              error={fieldErrors.newPassword}
            >
              <input
                type="password"
                value={values.newPassword}
                onChange={(e) => {
                  setValues({ ...values, newPassword: e.target.value });
                  if (fieldErrors.newPassword) {
                    setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
                  }
                }}
                className={formInputClass(Boolean(fieldErrors.newPassword))}
              />
            </FormField>
            <FormField
              label="Repetir nueva contraseña"
              required
              error={fieldErrors.confirmPassword}
            >
              <input
                type="password"
                value={values.confirmPassword}
                onChange={(e) => {
                  setValues({ ...values, confirmPassword: e.target.value });
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                className={formInputClass(Boolean(fieldErrors.confirmPassword))}
              />
            </FormField>
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
