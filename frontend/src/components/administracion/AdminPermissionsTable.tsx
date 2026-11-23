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
    const canAccess = Boolean(existing?.canAccess);

    draft[mod.id] = {
      moduleId: mod.id,
      canAccess,
      canRead: canAccess,
      canCreate: canAccess,
      canUpdate: canAccess,
      canDelete: canAccess,
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

  const toggleModuleAccess = (mod: RegisteredModule) => {
    if (!selectedRole || !mod.id) return;
    setDraftState((prev) => {
      const base = prev?.roleId === selectedRole.id ? prev.map : initialDraft;
      const current = base[mod.id!];
      const nextAccess = !current?.canAccess;

      return {
        roleId: selectedRole.id,
        map: {
          ...base,
          [mod.id!]: {
            moduleId: mod.id!,
            canAccess: nextAccess,
            canRead: nextAccess,
            canCreate: nextAccess,
            canUpdate: nextAccess,
            canDelete: nextAccess,
            specialPermissions: [],
          },
        },
      };
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
        Crea al menos un cargo para configurar el acceso a módulos.
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-[22px] border border-[#e4e9f1] bg-white p-[27px] shadow-[0_7px_25px_rgba(0,5,84,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-[20px] text-[#000254]">Acceso a módulos por cargo</h2>
          <p className="mt-1 mb-0 text-xs text-[#627089]">
            Elige un cargo y marca a qué módulos tiene acceso.
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
        <div className="grid grid-cols-[minmax(180px,1fr)_100px] items-center gap-2 border-b border-[#e4e9f1] px-3 py-3 text-center text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#627089]">
          <span className="text-left">Módulo</span>
          <span>Acceso</span>
        </div>

        {modules.map((mod) => {
          if (!mod.id) return null;
          const entry = draft[mod.id];
          const canAccess = Boolean(entry?.canAccess);

          return (
            <div
              key={mod.id}
              className="grid grid-cols-[minmax(180px,1fr)_100px] items-center gap-2 border-b border-[#eef1f6] px-3 py-3.5"
            >
              <div className="text-left">
                <strong className="text-sm text-[#000254]">{mod.name}</strong>
                {mod.isImplemented === false && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    En desarrollo
                  </span>
                )}
              </div>

              <label className="grid place-items-center">
                <input
                  type="checkbox"
                  checked={canAccess}
                  onChange={() => toggleModuleAccess(mod)}
                  aria-label={`${mod.name} Acceso`}
                  className="h-[18px] w-[18px] cursor-pointer accent-[#01317b]"
                />
              </label>
            </div>
          );
        })}
      </div>
    </section>
  );
}
