import { useState, type FormEvent } from 'react';
import { Check, KeyRound, Pencil, Plus, Shield, ShieldOff, Trash2, UserRound, X } from 'lucide-react';
import type { AdminRole, AdminUser } from '../../services/api';

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
  onResetMfa: (userId: string) => Promise<void>;
  onDeactivateUser: (user: AdminUser) => Promise<void>;
  onDeleteUser: (user: AdminUser) => Promise<void>;
}

const fieldLabelClass = 'grid gap-[7px] text-[13px] font-bold text-[#0c1933]';
const fieldControlClass =
  'w-full rounded-[11px] border border-[#e4e9f1] bg-white px-[13px] py-3 outline-none focus:border-[#01317b] focus:shadow-[0_0_0_4px_rgba(1,49,123,0.09)]';

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
  onResetMfa,
  onDeactivateUser,
  onDeleteUser,
}: AdminUsersSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; email: string }>({
    name: '',
    email: '',
  });

  const startEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setEditDraft({ name: user.name, email: user.email });
  };

  const saveEdit = async (userId: string) => {
    if (!editDraft.name.trim() || !editDraft.email.trim()) return;
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
          <h2 className="m-0 text-[20px] text-[#000254]">Crear cuenta</h2>
        </div>

        <form className="grid gap-4" onSubmit={onCreateUser}>
          <label className={fieldLabelClass}>
            Nombre completo
            <input
              required
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              className={fieldControlClass}
            />
          </label>
          <label className={fieldLabelClass}>
            Correo electrónico
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => onFormChange({ ...form, email: e.target.value })}
              className={fieldControlClass}
            />
          </label>
          <label className={fieldLabelClass}>
            Cargo inicial (único)
            <select
              value={form.roleId}
              onChange={(e) => onFormChange({ ...form, roleId: e.target.value })}
              className={fieldControlClass}
            >
              <option value="">Sin cargo asignado</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="button button-primary cursor-pointer">
            <Plus size={16} /> Crear usuario
          </button>
        </form>
      </section>

      <section className="grid gap-3 rounded-[22px] border border-[#e4e9f1] bg-white p-[27px] shadow-[0_7px_25px_rgba(0,5,84,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 text-[20px] text-[#000254]">Cuentas ({users.length})</h2>
          <span className="text-xs text-[#627089]">
            Cada usuario puede tener como máximo un cargo activo.
          </span>
        </div>

        {users.map((user) => {
          const isProtected = user.isSuperAdmin || user.id === currentUserId;
          const badge = STATUS_BADGES[user.status] ?? STATUS_BADGES.ACTIVE;
          const isEditing = editingId === user.id;

          return (
            <div
              key={user.id}
              className="rounded-2xl border border-[#eef1f6] bg-[#fafbfd] p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  {isEditing ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        aria-label={`Editar nombre de ${user.name}`}
                        value={editDraft.name}
                        onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))}
                        className="rounded-lg border border-[#c9d9ef] bg-white px-2.5 py-1.5 text-xs"
                      />
                      <input
                        type="email"
                        aria-label={`Editar correo de ${user.name}`}
                        value={editDraft.email}
                        onChange={(e) =>
                          setEditDraft((prev) => ({ ...prev, email: e.target.value }))
                        }
                        className="rounded-lg border border-[#c9d9ef] bg-white px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm text-[#000254]">{user.name}</strong>
                        {user.isSuperAdmin && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#000254] px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                            <Shield size={10} /> Superadministrador
                          </span>
                        )}
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <span className="rounded-full border border-[#e4e9f1] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#627089]">
                          {user.mfaConfiguredAt ? 'MFA activo' : 'MFA pendiente'}
                        </span>
                        {user.mustChangePassword && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            Cambio clave pendiente
                          </span>
                        )}
                      </div>
                      <div className="break-all text-xs text-[#627089]">
                        {user.email} ·{' '}
                        <strong className="text-[#01317b]">
                          {user.isSuperAdmin
                            ? 'Acceso global'
                            : user.role?.name ?? 'Sin cargo asignado'}
                        </strong>
                      </div>
                    </>
                  )}
                </div>

                {!isProtected ? (
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
                ) : (
                  <span className="rounded-lg border border-[#dce6f5] bg-white px-2.5 py-1 text-[11px] font-bold text-[#01317b]">
                    Cuenta protegida
                  </span>
                )}
              </div>

              {!isProtected && (
                <div className="flex flex-wrap items-center gap-3 border-t border-[#eef1f6] pt-2.5 text-xs">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void saveEdit(user.id)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#01317b] px-2.5 py-1 font-bold text-white"
                      >
                        <Check size={13} /> Guardar datos
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
                      <Pencil size={13} /> Editar datos
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void onResetPassword(user.id)}
                    className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 font-bold text-[#01317b]"
                  >
                    <KeyRound size={13} /> Restablecer contraseña
                  </button>

                  <button
                    type="button"
                    onClick={() => void onResetMfa(user.id)}
                    className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 font-bold text-[#01317b]"
                  >
                    <ShieldOff size={13} /> Reiniciar MFA
                  </button>

                  {user.status !== 'DISABLED' && (
                    <button
                      type="button"
                      onClick={() => void onDeactivateUser(user)}
                      className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 font-bold text-amber-700"
                    >
                      Desactivar
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void onDeleteUser(user)}
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
