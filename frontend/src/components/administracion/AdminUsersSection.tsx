import { useState, type FormEvent } from 'react';
import { Check, KeyRound, Pencil, Plus, Shield, Trash2, UserRound, X } from 'lucide-react';
import type { AdminRole, AdminUser } from '../../services/api';
import FormField from '../shared/forms/FormField';
import { formInputClass } from '../shared/forms/formStyles';

interface AdminUsersSectionProps {
  users: AdminUser[];
  roles: AdminRole[];
  currentUserId?: string;
  form: { name: string; email: string; roleId: string };
  onFormChange: (next: { name: string; email: string; roleId: string }) => void;
  onCreateUser: (event: FormEvent) => Promise<void>;
  onUpdateUserProfile: (userId: string, data: { name: string; email: string }) => Promise<void>;
  onUpdateUserRole: (userId: string, roleId: string | null) => Promise<void>;
  onUpdateUserStatus: (userId: string, status: 'ACTIVE' | 'BLOCKED' | 'DISABLED') => Promise<void>;
  onResetPassword: (userId: string) => Promise<void>;
  onRequestDeleteUser: (user: AdminUser) => void;
}

type UserFieldErrors = {
  name?: string;
  email?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateUserFields(name: string, email: string): UserFieldErrors {
  const errors: UserFieldErrors = {};
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  if (!trimmedName) {
    errors.name = 'El nombre es obligatorio.';
  } else if (trimmedName.length > 120) {
    errors.name = 'El nombre no puede superar los 120 caracteres.';
  }

  if (!trimmedEmail) {
    errors.email = 'El correo electrónico es obligatorio.';
  } else if (!EMAIL_REGEX.test(trimmedEmail)) {
    errors.email = 'Introduce un correo electrónico válido.';
  } else if (trimmedEmail.length > 180) {
    errors.email = 'El correo no puede superar los 180 caracteres.';
  }

  return errors;
}

const STATUS_BADGES: Record<AdminUser['status'], { label: string; className: string }> = {
  ACTIVE: { label: 'Activo', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  INVITED: { label: 'Invitado', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  BLOCKED: { label: 'Bloqueado', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  DISABLED: { label: 'Desactivado', className: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function AdminUsersSection({
  users,
  roles,
  currentUserId,
  form,
  onFormChange,
  onCreateUser,
  onUpdateUserProfile,
  onUpdateUserRole,
  onUpdateUserStatus,
  onResetPassword,
  onRequestDeleteUser,
}: AdminUsersSectionProps) {
  const [createErrors, setCreateErrors] = useState<UserFieldErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; email: string }>({
    name: '',
    email: '',
  });
  const [editErrors, setEditErrors] = useState<UserFieldErrors>({});

  const startEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setEditDraft({ name: user.name, email: user.email });
    setEditErrors({});
  };

  const handleCreateSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateUserFields(form.name, form.email);
    if (Object.keys(nextErrors).length > 0) {
      setCreateErrors(nextErrors);
      return;
    }
    setCreateErrors({});
    await onCreateUser(event);
  };

  const saveEdit = async (userId: string) => {
    const nextErrors = validateUserFields(editDraft.name, editDraft.email);
    if (Object.keys(nextErrors).length > 0) {
      setEditErrors(nextErrors);
      return;
    }
    setEditErrors({});
    await onUpdateUserProfile(userId, {
      name: editDraft.name.trim(),
      email: editDraft.email.trim(),
    });
    setEditingId(null);
  };

  return (
    <div className="grid grid-cols-1 gap-[18px] min-[900px]:grid-cols-[minmax(250px,0.72fr)_1.28fr]">
      <section className="self-start rounded-[22px] border border-[#e4e9f1] bg-white p-[27px] shadow-[0_7px_25px_rgba(0,5,84,0.04)]">
        <div className="mb-5 flex items-center gap-[9px] text-[#01317b]">
          <UserRound size={20} />
          <h2 className="m-0 text-[20px] text-[#000254]">Nuevo usuario</h2>
        </div>

        <form className="grid gap-4" noValidate onSubmit={(e) => void handleCreateSubmit(e)}>
          <FormField label="Nombre" required error={createErrors.name}>
            <input
              value={form.name}
              onChange={(e) => {
                onFormChange({ ...form, name: e.target.value });
                if (createErrors.name) {
                  setCreateErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              className={formInputClass(Boolean(createErrors.name))}
            />
          </FormField>
          <FormField label="Correo electrónico" required error={createErrors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => {
                onFormChange({ ...form, email: e.target.value });
                if (createErrors.email) {
                  setCreateErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              className={formInputClass(Boolean(createErrors.email))}
            />
          </FormField>
          <FormField label="Cargo">
            <select
              value={form.roleId}
              onChange={(e) => onFormChange({ ...form, roleId: e.target.value })}
              className={formInputClass()}
            >
              <option value="">Sin cargo</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </FormField>
          <button type="submit" className="button button-primary cursor-pointer">
            <Plus size={16} /> Crear usuario
          </button>
        </form>
      </section>

      <section className="grid gap-3 self-start rounded-[22px] border border-[#e4e9f1] bg-white p-[27px] shadow-[0_7px_25px_rgba(0,5,84,0.04)]">
        <h2 className="m-0 mb-1 text-[20px] text-[#000254]">Usuarios ({users.length})</h2>

        {users.map((user) => {
          const isProtected = user.isSuperAdmin || user.id === currentUserId;
          const badge = STATUS_BADGES[user.status] ?? STATUS_BADGES.ACTIVE;
          const isEditing = editingId === user.id;

          return (
            <div
              key={user.id}
              className="rounded-2xl border border-[#eef1f6] bg-[#fafbfd] p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  {isEditing ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <input
                          aria-label={`Editar nombre de ${user.name}`}
                          value={editDraft.name}
                          onChange={(e) => {
                            setEditDraft((prev) => ({ ...prev, name: e.target.value }));
                            if (editErrors.name) {
                              setEditErrors((prev) => ({ ...prev, name: undefined }));
                            }
                          }}
                          className={formInputClass(Boolean(editErrors.name), 'min-h-[34px] py-1.5 text-xs')}
                        />
                        {editErrors.name && (
                          <p className="mt-1 text-[11px] font-medium text-rose-600">{editErrors.name}</p>
                        )}
                      </div>
                      <div>
                        <input
                          type="email"
                          aria-label={`Editar correo de ${user.name}`}
                          value={editDraft.email}
                          onChange={(e) => {
                            setEditDraft((prev) => ({ ...prev, email: e.target.value }));
                            if (editErrors.email) {
                              setEditErrors((prev) => ({ ...prev, email: undefined }));
                            }
                          }}
                          className={formInputClass(Boolean(editErrors.email), 'min-h-[34px] py-1.5 text-xs')}
                        />
                        {editErrors.email && (
                          <p className="mt-1 text-[11px] font-medium text-rose-600">{editErrors.email}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm text-[#000254]">{user.name}</strong>
                        {user.isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#000254] px-2.5 py-0.5 text-[10px] font-bold text-white">
                            <Shield size={10} /> Superadministrador
                          </span>
                        ) : (
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <div className="break-all text-xs text-[#627089]">{user.email}</div>
                    </>
                  )}
                </div>

                {!isProtected && (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label={`Cargo de ${user.name}`}
                      value={user.role?.id ?? user.roleId ?? ''}
                      onChange={(e) =>
                        void onUpdateUserRole(user.id, e.target.value ? e.target.value : null)
                      }
                      className="rounded-lg border border-[#e4e9f1] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#000254]"
                    >
                      <option value="">Sin cargo</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label={`Estado de ${user.name}`}
                      value={user.status === 'INVITED' ? 'ACTIVE' : user.status}
                      onChange={(e) =>
                        void onUpdateUserStatus(
                          user.id,
                          e.target.value as 'ACTIVE' | 'BLOCKED' | 'DISABLED',
                        )
                      }
                      className="rounded-lg border border-[#e4e9f1] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#000254]"
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="BLOCKED">Bloqueado</option>
                      <option value="DISABLED">Desactivado</option>
                    </select>
                  </div>
                )}
              </div>

              {!isProtected && (
                <div className="flex flex-wrap items-center gap-4 border-t border-[#eef1f6] pt-2.5 text-xs">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void saveEdit(user.id)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#01317b] px-2.5 py-1 font-bold text-white"
                      >
                        <Check size={13} /> Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#e4e9f1] bg-white px-2.5 py-1 font-bold text-[#627089]"
                      >
                        <X size={13} /> Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(user)}
                      className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 font-bold text-[#01317b]"
                    >
                      <Pencil size={13} /> Editar
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void onResetPassword(user.id)}
                    className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 font-bold text-[#01317b]"
                  >
                    <KeyRound size={13} /> Restablecer clave
                  </button>

                  <button
                    type="button"
                    onClick={() => onRequestDeleteUser(user)}
                    className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 font-bold text-[#e22328]"
                  >
                    <Trash2 size={13} /> Eliminar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
