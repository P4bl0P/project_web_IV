import { useMemo, useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import type {
  AdminRole,
  RegisteredModule,
  RolePermissionUpdateItem,
} from '../../services/api';

interface AdminPermissionsTableProps {
  roles: AdminRole[];
  modules: RegisteredModule[];
  selectedRoleId: string;
  onSelectRole: (roleId: string) => void;
  onSaveRolePermissions: (
    roleId: string,
    permissions: RolePermissionUpdateItem[],
  ) => Promise<void>;
  saving?: boolean;
}

type DraftPermissionMap = Record<string, RolePermissionUpdateItem>;

function buildDraftFromRole(
  role: AdminRole | undefined,
  modules: RegisteredModule[],
): DraftPermissionMap {
  const byModuleId = new Map((role?.permissions ?? []).map((perm) => [perm.moduleId, perm]));
  const draft: DraftPermissionMap = {};
  for (const mod of modules) {
    if (!mod.id) continue;
    const existing = byModuleId.get(mod.id);
    const canCreate = Boolean(existing?.canCreate && mod.supportsCreate);
    const canUpdate = Boolean(existing?.canUpdate && mod.supportsUpdate);
    const canDelete = Boolean(existing?.canDelete && mod.supportsDelete);
    const canRead = Boolean(
      (existing?.canRead || canCreate || canUpdate || canDelete) && mod.supportsRead,
    );
    const canAccess = Boolean(canRead || canCreate || canUpdate || canDelete);

    draft[mod.id] = {
      moduleId: mod.id,
      canAccess,
      canRead,
      canCreate,
      canUpdate,
      canDelete,
      specialPermissions: [],
    };
  }
  return draft;
}

export default function AdminPermissionsTable({
  roles,
  modules,
  selectedRoleId,
  onSelectRole,
  onSaveRolePermissions,
  saving = false,
}: AdminPermissionsTableProps) {
  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? roles[0],
    [roles, selectedRoleId],
  );

  const initialDraft = useMemo(
    () => buildDraftFromRole(selectedRole, modules),
    [selectedRole, modules],
  );

  const [draftState, setDraftState] = useState<{
    roleId: string;
    map: DraftPermissionMap;
  } | null>(null);

  const draft = useMemo(
    () =>
      selectedRole && draftState?.roleId === selectedRole.id
        ? draftState.map
        : initialDraft,
    [draftState, initialDraft, selectedRole],
  );

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initialDraft),
    [draft, initialDraft],
  );

  const toggleCrud = (
    mod: RegisteredModule,
    key: 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete',
  ) => {
    if (!selectedRole || !mod.id) return;
    setDraftState((prev) => {
      const base = prev?.roleId === selectedRole.id ? prev.map : initialDraft;
      const current = base[mod.id!] ?? {
        moduleId: mod.id!,
        canAccess: false,
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        specialPermissions: [],
      };

      const nextValue = !current[key];
      let next = { ...current, [key]: nextValue };

      if (key === 'canRead' && !nextValue) {
        next = {
          ...next,
          canRead: false,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
        };
      } else if (key !== 'canRead' && nextValue && mod.supportsRead) {
        next.canRead = true;
      }

      next.canAccess = Boolean(next.canRead || next.canCreate || next.canUpdate || next.canDelete);
      return { roleId: selectedRole.id, map: { ...base, [mod.id!]: next } };
    });
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    await onSaveRolePermissions(selectedRole.id, Object.values(draft));
    setDraftState(null);
  };

  if (!selectedRole) {
    return (
      <section className="rounded-[22px] border border-[#e4e9f1] bg-white p-[27px] text-sm text-[#627089]">
        Crea al menos un cargo para configurar sus permisos.
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-[22px] border border-[#e4e9f1] bg-white p-[27px] shadow-[0_7px_25px_rgba(0,5,84,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-[20px] text-[#000254]">Permisos por cargo</h2>
          <p className="mt-1 mb-0 text-xs text-[#627089]">
            Elige un cargo y marca qué puede hacer en cada módulo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDirty && (
            <button
              type="button"
              onClick={() => setDraftState(null)}
              disabled={saving}
              className="button button-ghost cursor-pointer min-h-[38px] px-3.5 text-xs"
            >
              <RotateCcw size={14} /> Descartar
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!isDirty || saving}
            className="button button-primary cursor-pointer min-h-[38px] px-4 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={14} /> {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Seleccionar cargo a configurar">
        {roles.map((role) => {
          const active = role.id === selectedRole.id;
          return (
            <button
              key={role.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectRole(role.id)}
              className={`cursor-pointer rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                active
                  ? 'border-[#01317b] bg-[#01317b] text-white'
                  : 'border-[#e4e9f1] bg-[#f8fafc] text-[#000254] hover:border-[#bac9e1]'
              }`}
            >
              {role.name}
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[520px] grid-cols-[minmax(180px,1fr)_repeat(4,80px)] items-center gap-2 border-b border-[#e4e9f1] px-3 py-3 text-center text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#627089]">
          <span className="text-left">Módulo</span>
          <span>Leer</span>
          <span>Crear</span>
          <span>Editar</span>
          <span>Eliminar</span>
        </div>

        {modules.map((mod) => {
          if (!mod.id) return null;
          const entry = draft[mod.id] ?? {
            moduleId: mod.id,
            canAccess: false,
            canRead: false,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            specialPermissions: [],
          };

          const columns: Array<{
            key: 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete';
            label: string;
            supported: boolean;
          }> = [
            { key: 'canRead', label: 'Leer', supported: mod.supportsRead },
            { key: 'canCreate', label: 'Crear', supported: mod.supportsCreate },
            { key: 'canUpdate', label: 'Editar', supported: mod.supportsUpdate },
            { key: 'canDelete', label: 'Eliminar', supported: mod.supportsDelete },
          ];

          return (
            <div
              key={mod.id}
              className="grid min-w-[520px] grid-cols-[minmax(180px,1fr)_repeat(4,80px)] items-center gap-2 border-b border-[#eef1f6] px-3 py-3.5"
            >
              <div className="text-left">
                <strong className="text-sm text-[#000254]">{mod.name}</strong>
                {mod.isImplemented === false && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    En desarrollo
                  </span>
                )}
              </div>

              {columns.map((col) => (
                <label key={col.key} className="grid place-items-center">
                  {col.supported ? (
                    <input
                      type="checkbox"
                      checked={entry[col.key]}
                      onChange={() => toggleCrud(mod, col.key)}
                      aria-label={`${mod.name} ${col.label}`}
                      className="h-[18px] w-[18px] cursor-pointer accent-[#01317b]"
                    />
                  ) : (
                    <span className="text-xs text-[#a7b3c5]">—</span>
                  )}
                </label>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
