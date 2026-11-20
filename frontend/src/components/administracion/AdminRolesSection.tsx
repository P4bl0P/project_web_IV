import { type FormEvent } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import type { AdminRole } from '../../services/api';

interface AdminRolesSectionProps {
  roles: AdminRole[];
  roleName: string;
  onRoleNameChange: (name: string) => void;
  onCreateRole: (event: FormEvent) => Promise<void>;
}

export default function AdminRolesSection({
  roles,
  roleName,
  onRoleNameChange,
  onCreateRole,
}: AdminRolesSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-[18px] min-[801px]:grid-cols-[minmax(230px,0.75fr)_1.25fr]">
      <section className="rounded-[22px] border border-[#e4e9f1] bg-white p-[27px] shadow-[0_7px_25px_rgba(0,5,84,0.04)]">
        <div className="mb-5 flex items-center gap-[9px] text-[#01317b]">
          <ShieldCheck size={20} />
          <h2 className="m-0 text-[20px] text-[#000254]">Nuevo cargo</h2>
        </div>

        <form className="grid gap-4" onSubmit={onCreateRole}>
          <label className="grid gap-[7px] text-[13px] font-bold text-[#0c1933]">
            Nombre
            <input
              required
              value={roleName}
              onChange={(e) => onRoleNameChange(e.target.value)}
              className="w-full rounded-[11px] border border-[#e4e9f1] bg-white px-[13px] py-3 outline-none focus:border-[#01317b] focus:shadow-[0_0_0_4px_rgba(1,49,123,0.09)]"
            />
          </label>
          <button type="submit" className="button button-primary cursor-pointer">
            <Plus size={16} /> Crear cargo
          </button>
        </form>
      </section>

      <section className="grid gap-[14px] rounded-[22px] border border-[#e4e9f1] bg-white p-[27px] shadow-[0_7px_25px_rgba(0,5,84,0.04)]">
        <h2 className="m-0 mb-1 text-[20px] text-[#000254]">Cargos configurables</h2>
        {roles.map((role) => (
          <div
            className="grid grid-cols-[1fr_auto] items-center gap-[14px] border-t border-[#eef1f6] pt-[13px] min-[801px]:grid-cols-[1fr_auto_auto]"
            key={role.id}
          >
            <div className="grid min-w-0 gap-1">
              <strong className="text-[13px] text-[#000254]">{role.name}</strong>
              <span className="break-all text-[11px] text-[#627089]">
                {role._count.users} usuarios · {role.permissions.length} módulos
              </span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
