import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, RefreshCw } from 'lucide-react';
import { useAuth } from '../auth';
import AdminAuditSection from '../components/administracion/AdminAuditSection';
import AdminConfirmModal from '../components/administracion/AdminConfirmModal';
import AdminRolesSection from '../components/administracion/AdminRolesSection';
import AdminUsersSection from '../components/administracion/AdminUsersSection';
import FormAlert from '../components/shared/forms/FormAlert';
import {
  adminApi,
  type AdminAuditEvent,
  type AdminRole,
  type AdminUser,
  type RegisteredModule,
  type RolePermissionUpdateItem,
} from '../services/api';

type Tab = 'users' | 'roles' | 'audit';

const TAB_LABELS: Record<Tab, string> = {
  users: 'Usuarios',
  roles: 'Cargos',
  audit: 'Auditoría',
};

type PendingDelete =
  | { kind: 'user'; user: AdminUser }
  | { kind: 'role'; role: AdminRole }
  | null;

export default function AdministracionPage() {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [modules, setModules] = useState<RegisteredModule[]>([]);
  const [auditEvents, setAuditEvents] = useState<AdminAuditEvent[]>([]);
  const [busy, setBusy] = useState(true);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [form, setForm] = useState({ name: '', email: '', roleId: '' });
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const [nextUsers, nextRoles, nextModules] = await Promise.all([
        adminApi.users(),
        adminApi.roles(),
        adminApi.modules(),
      ]);
      setUsers(nextUsers);
      setRoles(nextRoles);
      setModules(nextModules);
      setForm((v) => ({ ...v, roleId: v.roleId || nextRoles[0]?.id || '' }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar la administración');
    } finally {
      setBusy(false);
    }
  }, []);

  const loadAudit = useCallback(async (filters?: { result?: 'ALLOWED' | 'DENIED' }) => {
    setLoadingAudit(true);
    try {
      setAuditEvents(await adminApi.audit(filters));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar la auditoría');
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([adminApi.users(), adminApi.roles(), adminApi.modules()])
      .then(([nextUsers, nextRoles, nextModules]) => {
        if (cancelled) return;
        setUsers(nextUsers);
        setRoles(nextRoles);
        setModules(nextModules);
        setForm((v) => ({ ...v, roleId: v.roleId || nextRoles[0]?.id || '' }));
        setError('');
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : 'No se pudo cargar la administración');
        }
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(''), 5000);
    return () => window.clearTimeout(timer);
  }, [error]);

  const createUser = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      const result = await adminApi.createUser({
        name: form.name,
        email: form.email,
        roleId: form.roleId || null,
      });
      setTemporaryPassword(result.temporaryPassword);
      setForm({ name: '', email: '', roleId: roles[0]?.id || '' });
      setNotice(`Usuario ${result.user.name} creado.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear la cuenta');
    }
  };

  const handleUpdateUserProfile = async (
    userId: string,
    data: { name: string; email: string },
  ) => {
    setError('');
    setNotice('');
    try {
      const updated = await adminApi.updateUser(userId, data);
      setUsers((current) => current.map((item) => (item.id === userId ? updated : item)));
      setNotice(`Datos actualizados para ${updated.name}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron actualizar los datos');
    }
  };

  const handleUpdateUserRole = async (userId: string, roleId: string | null) => {
    setError('');
    setNotice('');
    try {
      const updated = await adminApi.updateUser(userId, { roleId });
      setUsers((current) => current.map((item) => (item.id === userId ? updated : item)));
      setNotice('Cargo actualizado.');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el cargo');
    }
  };

  const handleUpdateUserStatus = async (
    userId: string,
    status: 'ACTIVE' | 'BLOCKED' | 'DISABLED',
  ) => {
    setError('');
    setNotice('');
    try {
      const updated = await adminApi.updateUser(userId, { status });
      setUsers((current) => current.map((item) => (item.id === userId ? updated : item)));
      setNotice('Estado actualizado.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el estado');
    }
  };

  const handleResetPassword = async (userId: string) => {
    setError('');
    try {
      const result = await adminApi.resetPassword(userId);
      setTemporaryPassword(result.temporaryPassword);
      setNotice('Contraseña temporal generada.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo restablecer la contraseña');
    }
  };

  const createRole = async (event: FormEvent) => {
    event.preventDefault();
    if (!roleForm.name.trim()) return;
    setError('');
    setNotice('');
    try {
      const created = await adminApi.createRole({
        name: roleForm.name.trim(),
        description: roleForm.description.trim() || null,
      });
      setRoleForm({ name: '', description: '' });
      setNotice(`Cargo "${created.name}" creado.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear el cargo');
    }
  };

  const updateRole = async (
    roleId: string,
    data: { name: string; description: string | null },
  ) => {
    setError('');
    setNotice('');
    try {
      const updated = await adminApi.updateRole(roleId, data);
      setNotice(`Cargo "${updated.name}" actualizado.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el cargo');
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setError('');
    setNotice('');
    try {
      if (pendingDelete.kind === 'user') {
        await adminApi.deleteUser(pendingDelete.user.id);
        setNotice(`Cuenta de ${pendingDelete.user.name} eliminada.`);
      } else {
        await adminApi.deleteRole(pendingDelete.role.id);
        setNotice(`Cargo "${pendingDelete.role.name}" eliminado.`);
      }
      setPendingDelete(null);
      await load();
    } catch (reason) {
      setPendingDelete(null);
      setError(
        reason instanceof Error ? reason.message : 'No se pudo completar la eliminación',
      );
    } finally {
      setDeleting(false);
    }
  };

  const toggleRoleModuleAccess = async (
    role: AdminRole,
    moduleId: string,
    nextAccess: boolean,
  ) => {
    setSavingRoleId(role.id);
    setError('');
    setNotice('');
    try {
      const existingByModuleId = new Map(role.permissions.map((perm) => [perm.moduleId, perm]));
      const permissionsPayload: RolePermissionUpdateItem[] = modules
        .filter((mod): mod is RegisteredModule & { id: string } => Boolean(mod.id))
        .map((mod) => {
          const enabled =
            mod.id === moduleId ? nextAccess : Boolean(existingByModuleId.get(mod.id)?.canAccess);
          return {
            moduleId: mod.id,
            canAccess: enabled,
            canRead: enabled,
            canCreate: enabled,
            canUpdate: enabled,
            canDelete: enabled,
            specialPermissions: [],
          };
        });
      const updatedRole = await adminApi.updateRolePermissions(role.id, permissionsPayload);
      setRoles((current) => current.map((item) => (item.id === role.id ? updatedRole : item)));
      setNotice(`Acceso a módulos actualizado para "${updatedRole.name}".`);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'No se pudo actualizar el acceso al módulo',
      );
    } finally {
      setSavingRoleId(null);
    }
  };

  return (
    <div className="page-width pt-8 pb-20 min-[801px]:pt-[52px]">
      <div className="mb-[34px] flex flex-col items-start justify-between gap-[15px] min-[801px]:flex-row min-[801px]:items-start">
        <div>
          <Link
            to="/gestion"
            className="inline-flex items-center gap-[7px] text-[13px] font-bold text-[#01317b] no-underline"
          >
            <ArrowLeft size={16} /> Área privada
          </Link>
          <span className="section-kicker mt-2 block">Superadministrador</span>
          <h1 className="mt-[10px] mb-[9px] text-[clamp(34px,5vw,54px)] tracking-[-0.06em] text-[#000254]">
            Administración
          </h1>
          <p className="m-0 text-[#627089]">
            Gestiona cuentas, cargos y acceso a módulos desde un único lugar.
          </p>
        </div>

        <button
          type="button"
          className="button button-ghost cursor-pointer"
          onClick={() => void load()}
        >
          <RefreshCw size={16} className={busy ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {error && (
        <div className="mb-4">
          <FormAlert>{error}</FormAlert>
        </div>
      )}

      {notice && (
        <div className="mb-4">
          <FormAlert tone="success">{notice}</FormAlert>
        </div>
      )}

      {temporaryPassword && (
        <div className="mb-[18px] flex flex-wrap items-center justify-between gap-[14px] rounded-[16px] border border-[#c9d9ef] bg-[#f2f7fd] px-[18px] py-4 text-[#01317b] min-[801px]:flex-nowrap">
          <div className="grid min-w-0 gap-[7px]">
            <strong>Contraseña temporal · se muestra una sola vez</strong>
            <code className="break-all text-[16px] text-[#000254]">{temporaryPassword}</code>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="button button-ghost cursor-pointer"
              onClick={() => void navigator.clipboard.writeText(temporaryPassword)}
            >
              <Copy size={16} /> Copiar
            </button>
            <button
              type="button"
              className="button button-ghost cursor-pointer"
              onClick={() => setTemporaryPassword('')}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <div className="mb-[18px] flex flex-wrap gap-[5px] rounded-[14px] border border-[#e4e9f1] bg-[#f8fafc] p-[5px]">
        {(Object.keys(TAB_LABELS) as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            className={`flex-1 min-w-[100px] cursor-pointer rounded-[10px] border-0 px-3 py-[10px] text-xs sm:text-sm font-bold transition-all ${
              tab === item
                ? 'bg-white text-[#000254] shadow-[0_3px_10px_rgba(0,5,84,0.08)]'
                : 'bg-transparent text-[#627089]'
            }`}
            onClick={() => {
              setTab(item);
              if (item === 'audit') {
                void loadAudit();
              }
            }}
          >
            {TAB_LABELS[item]}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <AdminUsersSection
          users={users}
          roles={roles}
          currentUserId={currentUser?.id}
          form={form}
          onFormChange={setForm}
          onCreateUser={createUser}
          onUpdateUserProfile={handleUpdateUserProfile}
          onUpdateUserRole={handleUpdateUserRole}
          onUpdateUserStatus={handleUpdateUserStatus}
          onResetPassword={handleResetPassword}
          onRequestDeleteUser={(user) => setPendingDelete({ kind: 'user', user })}
        />
      )}

      {tab === 'roles' && (
        <AdminRolesSection
          roles={roles}
          modules={modules}
          roleForm={roleForm}
          savingRoleId={savingRoleId}
          onRoleFormChange={setRoleForm}
          onCreateRole={createRole}
          onUpdateRole={updateRole}
          onToggleRoleModuleAccess={toggleRoleModuleAccess}
          onRequestDeleteRole={(role) => setPendingDelete({ kind: 'role', role })}
        />
      )}

      {tab === 'audit' && (
        <AdminAuditSection
          events={auditEvents}
          loading={loadingAudit}
          onRefresh={loadAudit}
        />
      )}

      {pendingDelete && (
        <AdminConfirmModal
          title={
            pendingDelete.kind === 'user'
              ? 'Eliminar cuenta de usuario'
              : 'Eliminar cargo'
          }
          description={
            pendingDelete.kind === 'user'
              ? `¿Seguro que deseas eliminar permanentemente la cuenta de ${pendingDelete.user.name} (${pendingDelete.user.email})? Esta acción cerrará sus sesiones y no se puede deshacer.`
              : `¿Seguro que deseas eliminar el cargo "${pendingDelete.role.name}"? Esta acción no se puede deshacer.`
          }
          busy={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
