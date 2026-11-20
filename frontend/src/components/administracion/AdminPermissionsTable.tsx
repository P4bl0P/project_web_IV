import type { PermissionRecord } from '../../services/api';

interface AdminPermissionsTableProps {
  permissions: PermissionRecord[];
  roleMap: Map<string, string>;
  onTogglePermission: (
    permission: PermissionRecord,
    key: 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete',
  ) => Promise<void>;
}

export default function AdminPermissionsTable({
  permissions,
  roleMap,
  onTogglePermission,
}: AdminPermissionsTableProps) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-[#e4e9f1] bg-white p-[27px] shadow-[0_7px_25px_rgba(0,5,84,0.04)]">
      <h2 className="m-0 text-[20px] text-[#000254]">Matriz de permisos</h2>
      <div className="mt-5 overflow-x-auto">
        <div className="grid min-w-[520px] grid-cols-[minmax(170px,1fr)_repeat(4,70px)] items-center gap-2 border-b border-[#e4e9f1] px-2 py-3 text-center text-[11px] font-extrabold text-[#627089]">
          <span className="text-left">Cargo · módulo</span>
          <span>Leer</span>
          <span>Crear</span>
          <span>Editar</span>
          <span>Eliminar</span>
        </div>

        {permissions.map((permission) => (
          <div
            className="grid min-w-[520px] grid-cols-[minmax(170px,1fr)_repeat(4,70px)] items-center gap-2 border-b border-[#eef1f6] px-2 py-3"
            key={permission.id}
          >
            <span className="grid gap-[3px] text-left text-[12px] text-[#000254]">
              <strong>{roleMap.get(permission.roleId) ?? permission.role.name}</strong>
              <small className="text-[10px] text-[#627089]">{permission.module.name}</small>
            </span>

            {(['canRead', 'canCreate', 'canUpdate', 'canDelete'] as const).map((key) => (
              <label key={key} className="grid place-items-center">
                <input
                  type="checkbox"
                  checked={permission[key]}
                  onChange={() => void onTogglePermission(permission, key)}
                  aria-label={`${permission.module.name} ${key}`}
                  className="h-[18px] w-[18px] accent-[#e22328]"
                />
              </label>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
