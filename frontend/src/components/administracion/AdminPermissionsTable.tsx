import { useMemo, useState } from 'react';
import { RotateCcw, Save, ShieldCheck } from 'lucide-react';
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
    draft[mod.id] = {
      moduleId: mod.id,
      canAccess: Boolean(existing?.canAccess),
      canRead: Boolean(existing?.canRead && mod.supportsRead),
      canCreate: Boolean(existing?.canCreate && mod.supportsCreate),
      canUpdate: Boolean(existing?.canUpdate && mod.supportsUpdate),
      canDelete: Boolean(existing?.canDelete && mod.supportsDelete),
      specialPermissions: Array.isArray(existing?.specialPermissions)
        ? [...existing.specialPermissions]
        : [],
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

  const updateDraft = (updater: (current: DraftPermissionMap) => DraftPermissionMap) => {
    if (!selectedRole) return;
    setDraftState((prev) => {
      const base = prev?.roleId === selectedRole.id ? prev.map : initialDraft;
      return { roleId: selectedRole.id, map: updater(base) };
    });
  };

  const toggleAccess = (mod: RegisteredModule) => {
    if (!mod.id) return;
    updateDraft((prev) => {
      const current = prev[mod.id!] ?? {
        moduleId: mod.id!,
        canAccess: false,
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        specialPermissions: [],
      };
      const nextAccess = !current.canAccess;
      return {
        ...prev,
        [mod.id!]: nextAccess
          ? {
              ...current,
              canAccess: true,
              canRead: current.canRead || mod.supportsRead,
            }
          : {
              ...current,
              canAccess: false,
              canRead: false,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
              specialPermissions: [],
            },
      };
    });
  };

  const toggleCrud = (
    moduleId: string,
    key: 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete',
  ) => {
    updateDraft((prev) => {
      const current = prev[moduleId];
      if (!current) return prev;
      const nextValue = !current[key];
      return {
        ...prev,
        [moduleId]: {
          ...current,
          canAccess: nextValue ? true : current.canAccess,
          [key]: nextValue,
        },
      };
    });
  };

  const toggleSpecial = (moduleId: string, specialKey: string) => {
    updateDraft((prev) => {
      const current = prev[moduleId];
      if (!current) return prev;
      const exists = current.specialPermissions.includes(specialKey);
      const nextSpecial = exists
        ? current.specialPermissions.filter((item) => item !== specialKey)
        : [...current.specialPermissions, specialKey];
      return {
        ...prev,
        [moduleId]: {
          ...current,
          canAccess: nextSpecial.length > 0 ? true : current.canAccess,
          specialPermissions: nextSpecial,
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
        Crea al menos un cargo para configurar sus permisos.
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-[22px] border border-[#e4e9f1] bg-white p-[27px] shadow-[0_7px_25px_rgba(0,5,84,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eef1f6] pb-4">
        <div>
          <h2 className="m-0 text-[20px] text-[#000254]">Permisos por cargo</h2>
          <p className="mt-1 mb-0 text-xs text-[#627089]">
            Al guardar, las sesiones activas de los usuarios con este cargo se invalidarán para
            aplicar los permisos al instante.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-bold text-[#0c1933]">
            Cargo:{' '}
            <select
              aria-label="Seleccionar cargo a configurar"
              value={selectedRole.id}
              onChange={(e) => onSelectRole(e.target.value)}
              className="ml-1 rounded-xl border border-[#e4e9f1] bg-white px-3 py-2 text-xs font-bold text-[#000254]"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} ({role._count.users})
                </option>
              ))}
            </select>
          </label>

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

      <div className="rounded-xl border border-[#dce6f5] bg-[#f4f8fd] px-4 py-3 text-xs text-[#01317b]">
        <div className="flex flex-wrap items-center gap-2 font-bold">
          <ShieldCheck size={15} />
          <span>{selectedRole.name}</span>
          <span className="font-normal text-[#627089]">
            · {selectedRole._count.users} usuario(s) asignado(s)
          </span>
        </div>
        {selectedRole.description && (
          <p className="mt-1 mb-0 text-[#627089]">{selectedRole.description}</p>
        )}
      </div>

      <div className="space-y-3">
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

          const crudColumns: Array<{
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
              className={`rounded-2xl border p-4 transition-colors ${
                entry.canAccess
                  ? 'border-[#c9d9ef] bg-white'
                  : 'border-[#eef1f6] bg-[#fafbfd]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-[200px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-[#000254]">{mod.name}</strong>
                    <code className="rounded bg-[#eef1f6] px-1.5 py-0.5 text-[10px] text-[#627089]">
                      {mod.key}
                    </code>
                    {mod.isImplemented === false && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        En desarrollo
                      </span>
                    )}
                  </div>
                  {mod.description && (
                    <p className="mt-1 mb-0 text-xs text-[#627089]">{mod.description}</p>
                  )}
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#e4e9f1] bg-white px-3 py-2 text-xs font-bold text-[#000254]">
                  <input
                    type="checkbox"
                    checked={entry.canAccess}
                    onChange={() => toggleAccess(mod)}
                    aria-label={`Acceso al módulo ${mod.name}`}
                    className="h-4 w-4 accent-[#01317b]"
                  />
                  <span>Acceso al módulo</span>
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  {crudColumns.map((col) => (
                    <label
                      key={col.key}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        !col.supported || !entry.canAccess
                          ? 'text-[#a7b3c5]'
                          : 'cursor-pointer text-[#0c1933]'
                      }`}
                    >
                      {col.supported ? (
                        <input
                          type="checkbox"
                          disabled={!entry.canAccess}
                          checked={entry[col.key]}
                          onChange={() => toggleCrud(mod.id!, col.key)}
                          aria-label={`${mod.name} ${col.label}`}
                          className="h-4 w-4 accent-[#e22328]"
                        />
                      ) : (
                        <span className="text-[10px]">—</span>
                      )}
                      <span>{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {mod.specialActions?.length > 0 && (
                <div className="mt-3 border-t border-[#eef1f6] pt-3">
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#627089]">
                    Operaciones especiales
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {mod.specialActions.map((special) => {
                      const active = entry.specialPermissions.includes(special.key);
                      return (
                        <label
                          key={special.key}
                          title={special.description || special.label}
                          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                            !entry.canAccess
                              ? 'border-[#eef1f6] bg-[#f8fafc] text-[#a7b3c5]'
                              : active
                                ? 'cursor-pointer border-[#01317b] bg-[#edf3fb] text-[#01317b]'
                                : 'cursor-pointer border-[#e4e9f1] bg-white text-[#0c1933]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={!entry.canAccess}
                            checked={active}
                            onChange={() => toggleSpecial(mod.id!, special.key)}
                            aria-label={`${mod.name} ${special.label}`}
                            className="h-3.5 w-3.5 accent-[#01317b]"
                          />
                          <span>{special.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
