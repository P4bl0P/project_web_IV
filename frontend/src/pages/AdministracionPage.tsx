import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, RefreshCw } from 'lucide-react';
import AdminPermissionsTable from '../components/administracion/AdminPermissionsTable';
import AdminRolesSection from '../components/administracion/AdminRolesSection';
import AdminUsersSection from '../components/administracion/AdminUsersSection';
import FormAlert from '../components/shared/forms/FormAlert';
import { adminApi, type AdminRole, type AdminUser, type PermissionRecord } from '../services/api';

type Tab = 'users' | 'roles' | 'permissions';

export default function AdministracionPage() {
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [form, setForm] = useState({ name: '', email: '', roleId: '' });
  const [roleName, setRoleName] = useState('');

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const [nextUsers, nextRoles, nextPermissions] = await Promise.all([
        adminApi.users(),
        adminApi.roles(),
        adminApi.permissions(),
      ]);
      setUsers(nextUsers);
      setRoles(nextRoles);
      setPermissions(nextPermissions);
      setForm((v) => ({ ...v, roleId: v.roleId || nextRoles[0]?.id || '' }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar la administración');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([adminApi.users(), adminApi.roles(), adminApi.permissions()])
      .then(([nextUsers, nextRoles, nextPermissions]) => {
        if (cancelled) return;
        setUsers(nextUsers);
        setRoles(nextRoles);
        setPermissions(nextPermissions);
        setForm((v) => ({ ...v, roleId: v.roleId || nextRoles[0]?.id || '' }));
        setError('');
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof Error ? reason.message : 'No se pudo cargar la administración',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const roleMap = useMemo(() => new Map(roles.map((role) => [role.id, role.name])), [roles]);

  const createUser = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const result = await adminApi.createUser(form);
      setTemporaryPassword(result.temporaryPassword);
      setForm({ name: '', email: '', roleId: roles[0]?.id || '' });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear la cuenta');
    }
  };

  const createRole = async (event: FormEvent) => {
    event.preventDefault();
    if (!roleName.trim()) return;
    try {
      await adminApi.createRole(roleName);
      setRoleName('');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear el cargo');
    }
  };

  const handleUpdateUserRole = async (userId: string, roleId: string) => {
    try {
      const updated = await adminApi.updateUser(userId, { roleId });
      setUsers((current) => current.map((item) => (item.id === userId ? updated : item)));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el cargo');
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: AdminUser['status']) => {
    try {
      const updated = await adminApi.updateUser(userId, { status });
      setUsers((current) => current.map((item) => (item.id === userId ? updated : item)));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el estado');
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const result = await adminApi.resetPassword(userId);
      setTemporaryPassword(result.temporaryPassword);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo restablecer la contraseña');
    }
  };

  const handleDisableUser = async (user: AdminUser) => {
    if (!window.confirm(`¿Desactivar a ${user.name}?`)) return;
    try {
      await adminApi.disableUser(user.id);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo desactivar la cuenta');
    }
  };

  const togglePermission = async (
    permission: PermissionRecord,
    key: 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete',
  ) => {
    try {
      await adminApi.updatePermission(permission.id, { [key]: !permission[key] });
      setPermissions((current) =>
        current.map((item) =>
          item.id === permission.id ? { ...item, [key]: !item[key] } : item,
        ),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el permiso');
    }
  };

  return (
    <div className="page-width pt-8 pb-20 min-[801px]:pt-[52px]">
      <div className="mb-[42px] flex flex-col items-start justify-between gap-[15px] min-[801px]:flex-row min-[801px]:items-start">
        <div>
          <Link
            to="/gestion"
            className="inline-flex items-center gap-[7px] text-[13px] font-bold text-[#01317b] no-underline"
          >
            <ArrowLeft size={16} /> Área privada
          </Link>
          <span className="section-kicker mt-2 block">SUPER_ADMIN</span>
          <h1 className="mt-[10px] mb-[9px] text-[clamp(34px,5vw,54px)] tracking-[-0.06em] text-[#000254]">
            Administración
          </h1>
          <p className="m-0 text-[#627089]">
            Gestiona cuentas, cargos y permisos desde un único lugar.
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

      <div className="mb-[18px] flex gap-[5px] rounded-[14px] border border-[#e4e9f1] bg-[#f8fafc] p-[5px]">
        {(['users', 'roles', 'permissions'] as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            className={`flex-1 cursor-pointer rounded-[10px] border-0 px-3 py-[10px] font-bold transition-all ${
              tab === item
                ? 'bg-white text-[#000254] shadow-[0_3px_10px_rgba(0,5,84,0.08)]'
                : 'bg-transparent text-[#627089]'
            }`}
            onClick={() => setTab(item)}
          >
            {item === 'users' ? 'Usuarios' : item === 'roles' ? 'Cargos' : 'Permisos'}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <AdminUsersSection
          users={users}
          roles={roles}
          form={form}
          onFormChange={setForm}
          onCreateUser={createUser}
          onUpdateUserRole={handleUpdateUserRole}
          onUpdateUserStatus={handleUpdateUserStatus}
          onResetPassword={handleResetPassword}
          onDisableUser={handleDisableUser}
        />
      )}

      {tab === 'roles' && (
        <AdminRolesSection
          roles={roles}
          roleName={roleName}
          onRoleNameChange={setRoleName}
          onCreateRole={createRole}
        />
      )}

      {tab === 'permissions' && (
        <AdminPermissionsTable
          permissions={permissions}
          roleMap={roleMap}
          onTogglePermission={togglePermission}
        />
      )}
    </div>
  );
}
