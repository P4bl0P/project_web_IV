import { type FormEvent } from 'react';
import { Plus, UserRound } from 'lucide-react';
import type { AdminRole, AdminUser } from '../../services/api';

interface AdminUsersSectionProps {
  users: AdminUser[];
  roles: AdminRole[];
  form: { name: string; email: string; roleId: string };
  onFormChange: (next: { name: string; email: string; roleId: string }) => void;
  onCreateUser: (event: FormEvent) => Promise<void>;
  onUpdateUserRole: (userId: string, roleId: string) => Promise<void>;
  onUpdateUserStatus: (userId: string, status: AdminUser['status']) => Promise<void>;
  onResetPassword: (userId: string) => Promise<void>;
  onDisableUser: (user: AdminUser) => Promise<void>;
}

const fieldLabelClass = 'grid gap-[7px] text-[13px] font-bold text-[#0c1933]';
const fieldControlClass =
  'w-full rounded-[11px] border border-[#e4e9f1] bg-white px-[13px] py-3 outline-none focus:border-[#01317b] focus:shadow-[0_0_0_4px_rgba(1,49,123,0.09)]';
const rowActionLinkClass =
  'col-span-full mt-0 cursor-pointer border-0 bg-transparent text-left text-[12px] font-bold text-[#01317b] no-underline min-[801px]:col-span-1 min-[801px]:mt-[15px]';

export default function AdminUsersSection({
  users,
  roles,
  form,
  onFormChange,
  onCreateUser,
  onUpdateUserRole,
  onUpdateUserStatus,
  onResetPassword,
  onDisableUser,
}: AdminUsersSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-[18px] min-[801px]:grid-cols-[minmax(230px,0.75fr)_1.25fr]">
      <section className="rounded-[22px] border border-[#e4e9f1] bg-white p-[27px] shadow-[0_7px_25px_rgba(0,5,84,0.04)]">
        <div className="mb-5 flex items-center gap-[9px] text-[#01317b]">
          <UserRound size={20} />
          <h2 className="m-0 text-[20px] text-[#000254]">Crear cuenta</h2>
        </div>

        <form className="grid gap-4" onSubmit={onCreateUser}>
          <label className={fieldLabelClass}>
            Nombre
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
            Cargo
            <select
              required
              value={form.roleId}
              onChange={(e) => onFormChange({ ...form, roleId: e.target.value })}
              className={fieldControlClass}
            >
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

      <section className="grid gap-[14px] rounded-[22px] border border-[#e4e9f1] bg-white p-[27px] shadow-[0_7px_25px_rgba(0,5,84,0.04)]">
        <h2 className="m-0 mb-1 text-[20px] text-[#000254]">Responsables</h2>
        {users.map((user) => (
          <div
            className="grid grid-cols-[1fr_auto] items-center gap-[14px] border-t border-[#eef1f6] pt-[13px] min-[801px]:grid-cols-[1fr_auto_auto]"
            key={user.id}
          >
            <div className="grid min-w-0 gap-1">
              <strong className="text-[13px] text-[#000254]">{user.name}</strong>
              <span className="break-all text-[11px] text-[#627089]">
                {user.email} · {user.role?.name ?? 'Sin cargo'}
              </span>
            </div>

            <select
              aria-label={`Cargo de ${user.name}`}
              value={user.role?.id ?? ''}
              onChange={(e) => void onUpdateUserRole(user.id, e.target.value)}
              className="rounded-lg border border-[#e4e9f1] bg-white px-2.5 py-1.5 text-xs"
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
              value={user.status}
              onChange={(e) => void onUpdateUserStatus(user.id, e.target.value as AdminUser['status'])}
              className="rounded-lg border border-[#e4e9f1] bg-white px-2.5 py-1.5 text-xs"
            >
              <option value="ACTIVE">Activo</option>
              <option value="BLOCKED">Bloqueado</option>
              <option value="DISABLED">Desactivado</option>
            </select>

            <button
              type="button"
              className={rowActionLinkClass}
              onClick={() => void onResetPassword(user.id)}
            >
              Restablecer
            </button>
            <button
              type="button"
              className={rowActionLinkClass}
              onClick={() => void onDisableUser(user)}
            >
              Desactivar
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
