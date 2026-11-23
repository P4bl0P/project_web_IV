import { BadRequestException, ConflictException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import type { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  status: 'INVITED' | 'ACTIVE' | 'BLOCKED' | 'DISABLED';
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
  mfaSecret: string | null;
  mfaPendingSecret: string | null;
  mfaConfiguredAt: Date | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  roleId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface RoleRecord {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ModuleRecord {
  id: string;
  key: string;
  name: string;
  description: string | null;
  route: string | null;
  icon: string | null;
  isImplemented: boolean;
  isSystem: boolean;
  displayOrder: number;
  supportsRead: boolean;
  supportsCreate: boolean;
  supportsUpdate: boolean;
  supportsDelete: boolean;
  specialActions: Array<{ key: string; label: string }>;
}

interface PermissionRecord {
  id: string;
  roleId: string;
  moduleId: string;
  canAccess: boolean;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  specialPermissions: string[];
}

describe('AdminService - Gestión de usuarios, cargos únicos, permisos y protección del último superadmin', () => {
  let service: AdminService;
  let authService: AuthService;
  let users: UserRecord[];
  let roles: RoleRecord[];
  let modules: ModuleRecord[];
  let permissions: PermissionRecord[];
  let sessions: Array<{ id: string; userId: string; revokedAt: Date | null }>;
  let challenges: Array<{ id: string; userId: string; consumedAt: Date | null }>;
  let audits: Array<Record<string, unknown>>;

  beforeEach(() => {
    roles = [
      {
        id: 'role-sec',
        name: 'Secretaría',
        description: 'Secretaría del grupo',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'role-jef',
        name: 'Jefatura',
        description: 'Jefatura del grupo',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    modules = [
      {
        id: 'mod-sec',
        key: 'secretaria',
        name: 'Secretaría',
        description: 'Módulo Secretaría',
        route: '/gestion/secretaria',
        icon: 'folder-kanban',
        isImplemented: true,
        isSystem: true,
        displayOrder: 1,
        supportsRead: true,
        supportsCreate: true,
        supportsUpdate: true,
        supportsDelete: true,
        specialActions: [
          { key: 'read_medical_data', label: 'Datos médicos' },
          { key: 'manage_web_content', label: 'Contenido web' },
        ],
      },
      {
        id: 'mod-jef',
        key: 'jefatura',
        name: 'Jefatura',
        description: 'Módulo Jefatura',
        route: '/gestion/jefatura',
        icon: 'compass',
        isImplemented: false,
        isSystem: true,
        displayOrder: 2,
        supportsRead: true,
        supportsCreate: true,
        supportsUpdate: true,
        supportsDelete: true,
        specialActions: [],
      },
    ];
    permissions = [
      {
        id: 'perm-1',
        roleId: 'role-sec',
        moduleId: 'mod-sec',
        canAccess: true,
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        specialPermissions: ['read_medical_data', 'manage_web_content'],
      },
      {
        id: 'perm-2',
        roleId: 'role-sec',
        moduleId: 'mod-jef',
        canAccess: false,
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        specialPermissions: [],
      },
    ];
    users = [
      {
        id: 'sa-1',
        email: 'admin@example.org',
        name: 'Superadmin',
        passwordHash: 'hash',
        status: 'ACTIVE',
        isSuperAdmin: true,
        mustChangePassword: false,
        mfaSecret: null,
        mfaPendingSecret: null,
        mfaConfiguredAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
        roleId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'u-1',
        email: 'laura@example.org',
        name: 'Laura',
        passwordHash: 'hash',
        status: 'ACTIVE',
        isSuperAdmin: false,
        mustChangePassword: false,
        mfaSecret: null,
        mfaPendingSecret: null,
        mfaConfiguredAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
        roleId: 'role-sec',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    sessions = [
      { id: 's-1', userId: 'u-1', revokedAt: null },
      { id: 's-admin', userId: 'sa-1', revokedAt: null },
    ];
    challenges = [{ id: 'ch-1', userId: 'u-1', consumedAt: null }];
    audits = [];

    const enrichUser = (u: UserRecord) => ({
      ...u,
      role: roles.find((r) => r.id === u.roleId) ?? null,
    });
    const enrichRole = (r: RoleRecord) => ({
      ...r,
      _count: { users: users.filter((u) => u.roleId === r.id).length },
      permissions: permissions
        .filter((p) => p.roleId === r.id)
        .map((p) => ({ ...p, module: modules.find((m) => m.id === p.moduleId)! })),
    });

    const prismaMock: Record<string, unknown> = {
      user: {
        findMany: async ({ where }: { where?: { roleId?: string; isSuperAdmin?: boolean } } = {}) =>
          users
            .filter((u) => {
              if (where?.roleId !== undefined && u.roleId !== where.roleId) return false;
              if (where?.isSuperAdmin !== undefined && u.isSuperAdmin !== where.isSuperAdmin)
                return false;
              return true;
            })
            .map(enrichUser),
        findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
          const found = users.find(
            (u) => (where.id && u.id === where.id) || (where.email && u.email === where.email),
          );
          return found ? enrichUser(found) : null;
        },
        count: async ({ where }: { where?: { roleId?: string; isSuperAdmin?: boolean; status?: string } }) =>
          users.filter((u) => {
            if (where?.roleId !== undefined && u.roleId !== where.roleId) return false;
            if (where?.isSuperAdmin !== undefined && u.isSuperAdmin !== where.isSuperAdmin)
              return false;
            if (where?.status !== undefined && u.status !== where.status) return false;
            return true;
          }).length,
        create: async ({ data }: { data: Partial<UserRecord> }) => {
          const row: UserRecord = {
            id: `u-${users.length + 1}`,
            email: data.email!,
            name: data.name!,
            passwordHash: data.passwordHash!,
            status: data.status ?? 'ACTIVE',
            isSuperAdmin: Boolean(data.isSuperAdmin),
            mustChangePassword: Boolean(data.mustChangePassword),
            mfaSecret: null,
            mfaPendingSecret: null,
            mfaConfiguredAt: null,
            failedLoginAttempts: 0,
            lockedUntil: null,
            roleId: data.roleId ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          users.push(row);
          return enrichUser(row);
        },
        update: async ({ where, data }: { where: { id: string }; data: Partial<UserRecord> }) => {
          const row = users.find((u) => u.id === where.id)!;
          Object.assign(row, data, { updatedAt: new Date() });
          return enrichUser(row);
        },
        delete: async ({ where }: { where: { id: string } }) => {
          const idx = users.findIndex((u) => u.id === where.id);
          const [removed] = users.splice(idx, 1);
          return removed;
        },
      },
      role: {
        findMany: async ({ where }: { where?: { id?: { not: string } } } = {}) =>
          roles
            .filter((r) => !where?.id?.not || r.id !== where.id.not)
            .map(enrichRole),
        findUnique: async ({ where }: { where: { id: string } }) => {
          const r = roles.find((item) => item.id === where.id);
          return r ? enrichRole(r) : null;
        },
        findUniqueOrThrow: async ({ where }: { where: { id: string } }) =>
          enrichRole(roles.find((item) => item.id === where.id)!),
        create: async ({ data }: { data: { name: string; description: string | null } }) => {
          const row: RoleRecord = {
            id: `role-${roles.length + 1}`,
            name: data.name,
            description: data.description,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          roles.push(row);
          return row;
        },
        update: async ({ where, data }: { where: { id: string }; data: Partial<RoleRecord> }) => {
          const row = roles.find((r) => r.id === where.id)!;
          Object.assign(row, data, { updatedAt: new Date() });
          return enrichRole(row);
        },
        delete: async ({ where }: { where: { id: string } }) => {
          const idx = roles.findIndex((r) => r.id === where.id);
          const [removed] = roles.splice(idx, 1);
          permissions = permissions.filter((p) => p.roleId !== where.id);
          return removed;
        },
      },
      module: {
        findMany: async ({ where }: { where?: { id?: { in?: string[]; not?: string } } } = {}) =>
          modules.filter((m) => {
            if (where?.id?.in && !where.id.in.includes(m.id)) return false;
            if (where?.id?.not && m.id === where.id.not) return false;
            return true;
          }),
        findUnique: async ({ where }: { where: { id: string } }) =>
          modules.find((m) => m.id === where.id) ?? null,
        create: async ({ data }: { data: Partial<ModuleRecord> }) => {
          const row: ModuleRecord = {
            id: `mod-${modules.length + 1}`,
            key: data.key!,
            name: data.name!,
            description: data.description ?? null,
            route: data.route ?? null,
            icon: data.icon ?? 'layers',
            isImplemented: Boolean(data.isImplemented),
            isSystem: Boolean(data.isSystem),
            displayOrder: data.displayOrder ?? 10,
            supportsRead: data.supportsRead ?? true,
            supportsCreate: data.supportsCreate ?? true,
            supportsUpdate: data.supportsUpdate ?? true,
            supportsDelete: data.supportsDelete ?? true,
            specialActions: (data.specialActions as ModuleRecord['specialActions']) ?? [],
          };
          modules.push(row);
          return row;
        },
        update: async ({ where, data }: { where: { id: string }; data: Partial<ModuleRecord> }) => {
          const row = modules.find((m) => m.id === where.id)!;
          Object.assign(row, data);
          return row;
        },
      },
      permission: {
        findMany: async ({ where }: { where?: { moduleId?: string } } = {}) =>
          permissions
            .filter((p) => !where?.moduleId || p.moduleId === where.moduleId)
            .map((p) => ({
              ...p,
              role: roles.find((r) => r.id === p.roleId)!,
              module: modules.find((m) => m.id === p.moduleId)!,
            })),
        createMany: async ({ data }: { data: Array<Omit<PermissionRecord, 'id'>> }) => {
          for (const item of data) {
            permissions.push({ id: `perm-${permissions.length + 1}`, ...item });
          }
          return { count: data.length };
        },
        upsert: async ({
          where,
          create,
          update,
        }: {
          where: { roleId_moduleId: { roleId: string; moduleId: string } };
          create: Omit<PermissionRecord, 'id'>;
          update: Partial<PermissionRecord>;
        }) => {
          const existing = permissions.find(
            (p) =>
              p.roleId === where.roleId_moduleId.roleId &&
              p.moduleId === where.roleId_moduleId.moduleId,
          );
          if (existing) {
            Object.assign(existing, update);
            return existing;
          }
          const row = { id: `perm-${permissions.length + 1}`, ...create };
          permissions.push(row);
          return row;
        },
      },
      session: {
        updateMany: async ({
          where,
          data,
        }: {
          where: { userId?: string | { in: string[] }; revokedAt: null };
          data: { revokedAt: Date };
        }) => {
          const targetIds =
            typeof where.userId === 'object' && where.userId?.in
              ? where.userId.in
              : where.userId
                ? [where.userId]
                : [];
          let count = 0;
          for (const s of sessions) {
            if (targetIds.includes(s.userId) && s.revokedAt === null) {
              s.revokedAt = data.revokedAt;
              count += 1;
            }
          }
          return { count };
        },
      },
      mfaChallenge: {
        updateMany: async ({
          where,
          data,
        }: {
          where: { userId?: string | { in: string[] }; consumedAt: null };
          data: { consumedAt: Date };
        }) => {
          const targetIds =
            typeof where.userId === 'object' && where.userId?.in
              ? where.userId.in
              : where.userId
                ? [where.userId]
                : [];
          let count = 0;
          for (const c of challenges) {
            if (targetIds.includes(c.userId) && c.consumedAt === null) {
              c.consumedAt = data.consumedAt;
              count += 1;
            }
          }
          return { count };
        },
      },
      recoveryCode: {
        deleteMany: async () => ({ count: 0 }),
      },
      auditEvent: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          audits.push(data);
          return data;
        },
        findMany: async () => audits,
      },
      $transaction: async (input: unknown) => {
        if (typeof input === 'function') {
          return (input as (tx: Record<string, unknown>) => Promise<unknown>)(prismaMock);
        }
        return Promise.all(input as Array<Promise<unknown>>);
      },
    };

    const typedPrisma = prismaMock as unknown as PrismaService;
    authService = new AuthService(typedPrisma);
    service = new AdminService(typedPrisma, authService);
  });

  it('impide crear cargos con nombres reservados y genera permisos denegados por defecto al crear un cargo o módulo', async () => {
    await expect(
      service.createRole('sa-1', { name: 'Superadministrador' }),
    ).rejects.toThrow(BadRequestException);

    const createdRole = await service.createRole('sa-1', {
      name: 'Coordinación de Campamento',
      description: 'Gestión logística',
    });
    expect(createdRole.permissions).toHaveLength(2);
    expect(createdRole.permissions.every((p) => !p.canAccess && !p.canRead)).toBe(true);

    const createdModule = await service.createModule('sa-1', {
      name: 'Intendencia',
      description: 'Control de material',
      supportsDelete: false,
    });
    expect(createdModule.key).toBe('intendencia');
    expect(permissions.some((p) => p.roleId === createdRole.id && p.moduleId === createdModule.id)).toBe(
      true,
    );
  });

  it('impide eliminar un cargo con usuarios asignados y permite eliminarlo tras reasignar o retirar el cargo', async () => {
    await expect(service.deleteRole('sa-1', 'role-sec')).rejects.toThrow(ConflictException);

    // Retirar el cargo de Laura (un usuario puede quedarse con roleId = null y revoca su sesión)
    await service.updateUser('sa-1', 'u-1', { roleId: null });
    expect(users.find((u) => u.id === 'u-1')?.roleId).toBeNull();
    expect(sessions.find((s) => s.id === 's-1')?.revokedAt).toBeInstanceOf(Date);
    expect(challenges.find((c) => c.id === 'ch-1')?.consumedAt).toBeInstanceOf(Date);

    // Ahora sí se puede eliminar el cargo Secretaría
    const deleted = await service.deleteRole('sa-1', 'role-sec');
    expect(deleted.ok).toBe(true);
    expect(roles.some((r) => r.id === 'role-sec')).toBe(false);
  });

  it('revoca sesiones activas cuando cambian los permisos de un cargo y registra valores previos y nuevos en auditoría', async () => {
    await service.updateRolePermissions('sa-1', 'role-sec', {
      permissions: [
        {
          moduleId: 'mod-sec',
          canAccess: false,
          canRead: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
          specialPermissions: ['read_medical_data'],
        },
        {
          moduleId: 'mod-jef',
          canAccess: true,
          canRead: true,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
          specialPermissions: [],
        },
      ],
    });

    // Sesión de Laura revocada inmediatamente al cambiar permisos de su cargo
    expect(sessions.find((s) => s.id === 's-1')?.revokedAt).toBeInstanceOf(Date);
    // La del superadmin no se ve afectada
    expect(sessions.find((s) => s.id === 's-admin')?.revokedAt).toBeNull();

    const secPerm = permissions.find((p) => p.roleId === 'role-sec' && p.moduleId === 'mod-sec')!;
    expect(secPerm.canAccess).toBe(false);
    expect(secPerm.canRead).toBe(false);
    expect(secPerm.specialPermissions).toEqual([]);

    const auditEntry = audits.find((a) => a.action === 'ROLE_PERMISSIONS_UPDATED');
    expect(auditEntry).toBeTruthy();
    expect(auditEntry?.previousValues).toBeTruthy();
    expect(auditEntry?.newValues).toBeTruthy();
  });

  it('protege al último superadministrador frente a edición, desactivación, bloqueo o eliminación', async () => {
    await expect(
      service.updateUser('sa-1', 'sa-1', { status: 'DISABLED' }),
    ).rejects.toThrow(ConflictException);
    await expect(service.deactivateUser('sa-1', 'sa-1')).rejects.toThrow(BadRequestException);
    await expect(service.deleteUser('sa-1', 'sa-1')).rejects.toThrow(BadRequestException);

    // Simular otro superadmin intentando desactivar/eliminar al último superadmin
    await expect(service.deactivateUser('other-actor', 'sa-1')).rejects.toThrow(ConflictException);
    await expect(service.deleteUser('other-actor', 'sa-1')).rejects.toThrow(ConflictException);
  });

  it('crea usuarios normales con un único cargo y sin exponer contraseñas temporales en auditoría', async () => {
    const created = await service.createUser('sa-1', {
      name: 'Carlos',
      email: 'CARLOS@Example.org',
      roleId: 'role-jef',
    });
    expect(created.user.email).toBe('carlos@example.org');
    expect(created.user.isSuperAdmin).toBe(false);
    expect(created.user.roleId).toBe('role-jef');
    expect(created.temporaryPassword).toBeTruthy();

    const userCreatedAudit = audits.find((a) => a.action === 'USER_CREATED');
    expect(JSON.stringify(userCreatedAudit)).not.toContain(created.temporaryPassword);
  });
});
