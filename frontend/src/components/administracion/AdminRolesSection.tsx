import { useState, type FormEvent } from 'react';
import { Check, Pencil, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import type { AdminRole } from '../../services/api';
import FormField from '../shared/forms/FormField';
import { formInputClass } from '../shared/forms/formStyles';

interface AdminRolesSectionProps {
  roles: AdminRole[];
  roleForm: { name: string; description: string };
  onRoleFormChange: (next: { name: string; description: string }) => void;
  onCreateRole: (event: FormEvent) => Promise<void>;
  onUpdateRole: (roleId: string, data: { name: string; description: string | null }) => Promise<void>;
  onRequestDeleteRole: (role: AdminRole) => void;
}

type RoleFieldErrors = {
  name?: string;
  description?: string;
};

function validateRoleFields(name: string, description: string): RoleFieldErrors {
  const errors: RoleFieldErrors = {};
  const trimmedName = name.trim();
  const trimmedDescription = description.trim();

  if (!trimmedName) {
    errors.name = 'El nombre del cargo es obligatorio.';
  } else if (trimmedName.length > 80) {
    errors.name = 'El nombre del cargo no puede superar los 80 caracteres.';
  }

  if (trimmedDescription.length > 300) {
    errors.description = 'La descripción no puede superar los 300 caracteres.';
  }

  return errors;
}

export default function AdminRolesSection({
  roles,
  roleForm,
  onRoleFormChange,
  onCreateRole,
  onUpdateRole,
  onRequestDeleteRole,
}: AdminRolesSectionProps) {
  const [createErrors, setCreateErrors] = useState<RoleFieldErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; description: string }>({
    name: '',
    description: '',
  });
  const [editErrors, setEditErrors] = useState<RoleFieldErrors>({});

  const startEdit = (role: AdminRole) => {
    setEditingId(role.id);
    setEditDraft({ name: role.name, description: role.description ?? '' });
    setEditErrors({});
  };

  const handleCreateSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateRoleFields(roleForm.name, roleForm.description);
    if (Object.keys(nextErrors).length > 0) {
      setCreateErrors(nextErrors);
      return;
    }
    setCreateErrors({});
    await onCreateRole(event);
  };

  const saveEdit = async (roleId: string) => {
    const nextErrors = validateRoleFields(editDraft.name, editDraft.description);
    if (Object.keys(nextErrors).length > 0) {
      setEditErrors(nextErrors);
      return;
    }
    setEditErrors({});
    await onUpdateRole(roleId, {
      name: editDraft.name.trim(),
      description: editDraft.description.trim() || null,
    });
    setEditingId(null);
  };

  return (
    <div className="grid grid-cols-1 gap-[18px] min-[900px]:grid-cols-[minmax(250px,0.72fr)_1.28fr]">
      <section className="self-start rounded-[22px] border border-[#e4e9f1] bg-white p-[27px] shadow-[0_7px_25px_rgba(0,5,84,0.04)]">
        <div className="mb-5 flex items-center gap-[9px] text-[#01317b]">
          <ShieldCheck size={20} />
          <h2 className="m-0 text-[20px] text-[#000254]">Nuevo cargo</h2>
        </div>

        <form className="grid gap-4" noValidate onSubmit={(e) => void handleCreateSubmit(e)}>
          <FormField label="Nombre" required error={createErrors.name}>
            <input
              value={roleForm.name}
              onChange={(e) => {
                onRoleFormChange({ ...roleForm, name: e.target.value });
                if (createErrors.name) {
                  setCreateErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              placeholder="Ej. Coordinación de Rama"
              className={formInputClass(Boolean(createErrors.name))}
            />
          </FormField>
          <FormField label="Descripción" error={createErrors.description}>
            <textarea
              rows={3}
              value={roleForm.description}
              onChange={(e) => {
                onRoleFormChange({ ...roleForm, description: e.target.value });
                if (createErrors.description) {
                  setCreateErrors((prev) => ({ ...prev, description: undefined }));
                }
              }}
              placeholder="Responsabilidades principales del cargo..."
              className={formInputClass(Boolean(createErrors.description), 'resize-y')}
            />
          </FormField>
          <button type="submit" className="button button-primary cursor-pointer">
            <Plus size={16} /> Crear cargo
          </button>
        </form>
      </section>

      <section className="grid gap-3 self-start rounded-[22px] border border-[#e4e9f1] bg-white p-[27px] shadow-[0_7px_25px_rgba(0,5,84,0.04)]">
        <h2 className="m-0 mb-1 text-[20px] text-[#000254]">Cargos ({roles.length})</h2>

        {roles.map((role) => {
          const isEditing = editingId === role.id;
          const activeModules = role.permissions
            .filter(
              (perm) =>
                perm.canAccess &&
                (perm.canRead || perm.canCreate || perm.canUpdate || perm.canDelete),
            )
            .map((perm) => perm.module.name);
          const hasAssignedUsers = role._count.users > 0;

          return (
            <div
              key={role.id}
              className="rounded-2xl border border-[#eef1f6] bg-[#fafbfd] p-4 space-y-2.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  {isEditing ? (
                    <div className="grid gap-2">
                      <div>
                        <input
                          aria-label={`Editar nombre del cargo ${role.name}`}
                          value={editDraft.name}
                          onChange={(e) => {
                            setEditDraft((prev) => ({ ...prev, name: e.target.value }));
                            if (editErrors.name) {
                              setEditErrors((prev) => ({ ...prev, name: undefined }));
                            }
                          }}
                          className={formInputClass(
                            Boolean(editErrors.name),
                            'min-h-[34px] py-1.5 text-sm font-bold text-[#000254]',
                          )}
                        />
                        {editErrors.name && (
                          <p className="mt-1 text-[11px] font-medium text-rose-600">
                            {editErrors.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <input
                          aria-label={`Editar descripción del cargo ${role.name}`}
                          value={editDraft.description}
                          onChange={(e) => {
                            setEditDraft((prev) => ({ ...prev, description: e.target.value }));
                            if (editErrors.description) {
                              setEditErrors((prev) => ({ ...prev, description: undefined }));
                            }
                          }}
                          placeholder="Descripción del cargo"
                          className={formInputClass(
                            Boolean(editErrors.description),
                            'min-h-[34px] py-1.5 text-xs',
                          )}
                        />
                        {editErrors.description && (
                          <p className="mt-1 text-[11px] font-medium text-rose-600">
                            {editErrors.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-base text-[#000254]">{role.name}</strong>
                        <span className="rounded-full border border-[#dce6f5] bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#01317b]">
                          {role._count.users} {role._count.users === 1 ? 'usuario' : 'usuarios'}
                        </span>
                      </div>
                      {role.description && (
                        <p className="m-0 text-xs text-[#627089]">{role.description}</p>
                      )}
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void saveEdit(role.id)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#01317b] px-3 py-1.5 text-xs font-bold text-white"
                      >
                        <Check size={13} /> Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#e4e9f1] bg-white px-3 py-1.5 text-xs font-bold text-[#627089]"
                      >
                        <X size={13} /> Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(role)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#e4e9f1] bg-white px-3 py-1.5 text-xs font-bold text-[#01317b]"
                      >
                        <Pencil size={13} /> Editar
                      </button>
                      <button
                        type="button"
                        disabled={hasAssignedUsers}
                        title={
                          hasAssignedUsers
                            ? 'Reasigna los usuarios de este cargo antes de eliminarlo'
                            : 'Eliminar cargo'
                        }
                        onClick={() => onRequestDeleteRole(role)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#f5c2c4] bg-white px-3 py-1.5 text-xs font-bold text-[#e22328] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <Trash2 size={13} /> Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 border-t border-[#eef1f6] pt-2">
                {activeModules.length > 0 ? (
                  activeModules.map((moduleName) => (
                    <span
                      key={moduleName}
                      className="rounded-lg bg-[#edf3fb] px-2.5 py-0.5 text-[11px] font-semibold text-[#01317b]"
                    >
                      {moduleName}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-[#627089]">Sin módulos habilitados</span>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
