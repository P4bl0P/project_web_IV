import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, RefreshCw } from 'lucide-react';
import { useAuth } from '../auth';
import AdminAuditSection from '../components/administracion/AdminAuditSection';
import AdminModulesSection from '../components/administracion/AdminModulesSection';
import AdminPermissionsTable from '../components/administracion/AdminPermissionsTable';
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
  type SpecialActionDefinition,
} from '../services/api';

type Tab = 'users' | 'roles' | 'permissions' | 'modules' | 'audit';

const TAB_LABELS: Record<Tab, string> = {
  users: 'Usuarios',
  roles: 'Cargos',
  permissions: 'Permisos',
  modules: 'Módulos',
  audit: 'Auditoría',
};

export default function AdministracionPage() {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [modules, setModules] = useState<RegisteredModule[]>([]);
  const [auditEvents, setAuditEvents] = useState<AdminAuditEvent[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [busy, setBusy] = useState(true);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
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
      setSelectedRoleId((current) =>
        current && nextRoles.some((role) => role.id === current)
          ? current
          : nextRoles[0]?.id || '',
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar la administración');
    } finally {
      setBusy(false);
    }
  }, []);

  const loadAudit = useCallback(
    async (filters?: { action?: string; result?: 'ALLOWED' | 'DENIED' }) => {
      setLoadingAudit(true);
      try {
        setAuditEvents(await adminApi.audit(filters));
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'No se pudo cargar la auditoría');
      } finally {
        setLoadingAudit(false);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([adminApi.users(), adminApi.roles(), adminApi.modules()])
      .then(([nextUsers, nextRoles, nextModules]) => {
        if (cancelled) return;
        setUsers(nextUsers);
        setRoles(nextRoles);
        setModules(nextModules);
        setForm((v) => ({ ...v, roleId: v.roleId || nextRoles[0]?.id || '' }));
        setSelectedRoleId((current) =>
          current && nextRoles.some((role) => role.id === current)
            ? current
            : nextRoles[0]?.id || '',
        );
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
      setNotice(`Cuenta creada para ${result.user.email}.`);
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
      setNotice('Cargo actualizado y sesiones anteriores del usuario invalidadas.');
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
      setNotice('Estado de la cuenta actualizado.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el estado');
    }
  };

  const handleResetPassword = async (userId: string) => {
    setError('');
    try {
      const result = await adminApi.resetPassword(userId);
      setTemporaryPassword(result.temporaryPassword);
      setNotice('Contraseña temporal generada y sesiones previas revocadas.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo restablecer la contraseña');
    }
  };

  const handleResetMfa = async (userId: string) => {
    if (!window.confirm('¿Reiniciar la configuración MFA de esta cuenta?')) return;
    setError('');
    try {
      await adminApi.resetMfa(userId);
      setNotice('MFA reiniciado. El usuario deberá configurarlo en su próximo acceso.');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo reiniciar el MFA');
    }
  };

  const handleDeactivateUser = async (user: AdminUser) => {
    if (!window.confirm(`¿Desactivar a ${user.name}? Sus sesiones activas se cerrarán de inmediato.`)) {
      return;
    }
    setError('');
    try {
      await adminApi.deactivateUser(user.id);
      setNotice(`Cuenta de ${user.name} desactivada.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo desactivar la cuenta');
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (
      !window.confirm(
        `¿Eliminar permanentemente la cuenta de ${user.name}? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setError('');
    try {
      await adminApi.deleteUser(user.id);
      setNotice(`Cuenta de ${user.name} eliminada.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo eliminar la cuenta');
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
      setNotice(`Cargo "${created.name}" creado. Configura sus permisos en la pestaña Permisos.`);
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

  const deleteRole = async (role: AdminRole) => {
    if (!window.confirm(`¿Eliminar el cargo "${role.name}"?`)) return;
    setError('');
    setNotice('');
    try {
      await adminApi.deleteRole(role.id);
      setNotice(`Cargo "${role.name}" eliminado.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo eliminar el cargo');
    }
  };

  const saveRolePermissions = async (
    roleId: string,
    permissionsPayload: RolePermissionUpdateItem[],
  ) => {
    setSavingPermissions(true);
    setError('');
    setNotice('');
    try {
      const updatedRole = await adminApi.updateRolePermissions(roleId, permissionsPayload);
      setRoles((current) =>
        current.map((item) => (item.id === roleId ? updatedRole : item)),
      );
      setNotice(
        `Permisos de "${updatedRole.name}" guardados y sesiones activas del cargo invalidadas.`,
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron guardar los permisos');
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleCreateModule = async (data: {
    key?: string;
    name: string;
    description?: string | null;
    isImplemented?: boolean;
    supportsRead: boolean;
    supportsCreate: boolean;
    supportsUpdate: boolean;
    supportsDelete: boolean;
    specialActions: SpecialActionDefinition[];
  }) => {
    setError('');
    setNotice('');
    try {
      const created = await adminApi.createModule(data);
      setNotice(`Módulo "${created.name}" registrado en el sistema de permisos.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo registrar el módulo');
    }
  };

  const handleToggleModuleImplemented = async (mod: RegisteredModule) => {
    if (!mod.id) return;
    setError('');
    try {
      await adminApi.updateModule(mod.id, { isImplemented: !mod.isImplemented });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el módulo');
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
            Gestiona cuentas, cargos, permisos por módulo, registro de módulos y auditoría.
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
          onResetMfa={handleResetMfa}
          onDeactivateUser={handleDeactivateUser}
          onDeleteUser={handleDeleteUser}
        />
      )}

      {tab === 'roles' && (
        <AdminRolesSection
          roles={roles}
          roleForm={roleForm}
          onRoleFormChange={setRoleForm}
          onCreateRole={createRole}
          onUpdateRole={updateRole}
          onDeleteRole={deleteRole}
          onConfigurePermissions={(roleId) => {
            setSelectedRoleId(roleId);
            setTab('permissions');
          }}
        />
      )}

      {tab === 'permissions' && (
        <AdminPermissionsTable
          roles={roles}
          modules={modules}
          selectedRoleId={selectedRoleId}
          onSelectRole={setSelectedRoleId}
          onSaveRolePermissions={saveRolePermissions}
          saving={savingPermissions}
        />
      )}

      {tab === 'modules' && (
        <AdminModulesSection
          modules={modules}
          onCreateModule={handleCreateModule}
          onToggleImplemented={handleToggleModuleImplemented}
        />
      )}

      {tab === 'audit' && (
        <AdminAuditSection
          events={auditEvents}
          loading={loadingAudit}
          onRefresh={loadAudit}
        />
      )}
    </div>
  );
}
