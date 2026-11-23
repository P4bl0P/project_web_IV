import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth.service';
import { AuthorizationService } from '../authorization/authorization.service';
import {
  isReservedRoleName,
  normalizeText,
  parseSpecialPermissions,
  slugifyModuleKey,
} from '../authorization/module-registry';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateModuleDto,
  CreateRoleDto,
  CreateUserDto,
  QueryAuditDto,
  UpdateModuleDto,
  UpdatePermissionDto,
  UpdateRoleDto,
  UpdateRolePermissionsDto,
  UpdateUserDto,
} from './dto/admin.dto';

const temporaryPassword = () => randomBytes(18).toString('base64url');

const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  status: true,
  isSuperAdmin: true,
  mustChangePassword: true,
  mfaConfiguredAt: true,
  roleId: true,
  role: { select: { id: true, name: true, description: true } },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminService {
  private readonly auditService: AuditService;
  private readonly authorization: AuthorizationService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    @Optional() auditService?: AuditService,
    @Optional() authorization?: AuthorizationService,
  ) {
    this.auditService = auditService ?? new AuditService(prisma);
    this.authorization = authorization ?? new AuthorizationService(prisma);
  }

  async listUsers() {
    return this.prisma.user.findMany({
      select: safeUserSelect,
      orderBy: [{ isSuperAdmin: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createUser(actorId: string, dto: CreateUserDto, ip?: string) {
    const email = dto.email.trim().toLowerCase();
    const name = dto.name.trim();
    if (!email || !name) {
      throw new BadRequestException('Nombre y correo electrónico son obligatorios');
    }

    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
      if (!role) {
        throw new BadRequestException('El cargo seleccionado no existe');
      }
    }

    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('El correo ya está registrado');
    }

    const password = temporaryPassword();
    const passwordHash = await argon2.hash(password);
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        roleId: dto.roleId ?? null,
        passwordHash,
        isSuperAdmin: false,
        status: 'ACTIVE',
        mustChangePassword: true,
      },
      select: safeUserSelect,
    });

    await this.auditService.record({
      actorId,
      action: 'USER_CREATED',
      targetType: 'user',
      targetId: user.id,
      resource: `user:${user.id}`,
      result: 'ALLOWED',
      ipAddress: ip,
      newValues: {
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        roleName: user.role?.name ?? null,
        status: user.status,
      },
    });

    return { user, temporaryPassword: password };
  }

  async updateUser(actorId: string, id: string, dto: UpdateUserDto, ip?: string) {
    const target = await this.prisma.user.findUnique({
      where: { id },
      include: { role: { select: { id: true, name: true } } },
    });
    if (!target) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (target.isSuperAdmin) {
      if (dto.status && dto.status !== 'ACTIVE') {
        const activeSuperAdmins = await this.prisma.user.count({
          where: { isSuperAdmin: true, status: 'ACTIVE' },
        });
        if (activeSuperAdmins <= 1) {
          throw new ConflictException(
            'No es posible desactivar o bloquear al último superadministrador activo',
          );
        }
      }
      throw new BadRequestException(
        'La cuenta de superadministrador está protegida y no puede modificarse desde este panel',
      );
    }

    if (id === actorId) {
      throw new BadRequestException('No puedes modificar tu propia cuenta desde este panel');
    }

    const email = dto.email?.trim().toLowerCase();
    if (email && email !== target.email) {
      const existingByEmail = await this.prisma.user.findUnique({ where: { email } });
      if (existingByEmail) {
        throw new ConflictException('El correo ya está registrado');
      }
    }

    let nextRoleName: string | null = target.role?.name ?? null;
    if (dto.roleId !== undefined) {
      if (dto.roleId === null) {
        nextRoleName = null;
      } else {
        const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
        if (!role) {
          throw new BadRequestException('El cargo seleccionado no existe');
        }
        nextRoleName = role.name;
      }
    }

    const roleChanged = dto.roleId !== undefined && dto.roleId !== target.roleId;
    const statusChanged = dto.status !== undefined && dto.status !== target.status;

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name?.trim() ? { name: dto.name.trim() } : {}),
        ...(email ? { email } : {}),
        ...(dto.roleId !== undefined ? { roleId: dto.roleId } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
      select: safeUserSelect,
    });

    if (roleChanged || (dto.status && dto.status !== 'ACTIVE')) {
      await this.authService.revokeUserSessions(id);
    }

    const previousValues = {
      name: target.name,
      email: target.email,
      roleId: target.roleId,
      roleName: target.role?.name ?? null,
      status: target.status,
    };
    const newValues = {
      name: updated.name,
      email: updated.email,
      roleId: updated.roleId,
      roleName: nextRoleName,
      status: updated.status,
    };

    const action = roleChanged
      ? 'USER_ROLE_CHANGED'
      : statusChanged
        ? 'USER_STATUS_CHANGED'
        : 'USER_UPDATED';

    await this.auditService.record({
      actorId,
      action,
      targetType: 'user',
      targetId: id,
      resource: `user:${id}`,
      result: 'ALLOWED',
      ipAddress: ip,
      previousValues,
      newValues,
    });

    return updated;
  }

  async resetPassword(actorId: string, id: string, ip?: string) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (target.isSuperAdmin) {
      throw new BadRequestException(
        'La cuenta de superadministrador no se puede restablecer desde este panel',
      );
    }

    const password = temporaryPassword();
    const passwordHash = await argon2.hash(password);
    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePassword: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    await this.authService.revokeUserSessions(id);

    await this.auditService.record({
      actorId,
      action: 'USER_PASSWORD_RESET',
      targetType: 'user',
      targetId: id,
      resource: `user:${id}`,
      result: 'ALLOWED',
      ipAddress: ip,
      newValues: { mustChangePassword: true },
    });

    return { temporaryPassword: password };
  }

  async resetMfa(actorId: string, id: string, ip?: string) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (target.isSuperAdmin) {
      throw new BadRequestException(
        'El segundo factor del superadministrador requiere recuperación segura en servidor',
      );
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { mfaSecret: null, mfaPendingSecret: null, mfaConfiguredAt: null },
      }),
      this.prisma.recoveryCode.deleteMany({ where: { userId: id } }),
    ]);
    await this.authService.revokeUserSessions(id);

    await this.auditService.record({
      actorId,
      action: 'USER_MFA_RESET',
      targetType: 'user',
      targetId: id,
      resource: `user:${id}`,
      result: 'ALLOWED',
      ipAddress: ip,
    });

    return { ok: true };
  }

  async deactivateUser(actorId: string, id: string, ip?: string) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (id === actorId) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta');
    }
    if (target.isSuperAdmin) {
      const activeSuperAdmins = await this.prisma.user.count({
        where: { isSuperAdmin: true, status: 'ACTIVE' },
      });
      if (activeSuperAdmins <= 1) {
        throw new ConflictException(
          'No es posible desactivar al último superadministrador activo del sistema',
        );
      }
      throw new BadRequestException(
        'La cuenta de superadministrador está protegida y no puede desactivarse desde este panel',
      );
    }

    await this.prisma.user.update({
      where: { id },
      data: { status: 'DISABLED' },
    });
    await this.authService.revokeUserSessions(id);

    await this.auditService.record({
      actorId,
      action: 'USER_DISABLED',
      targetType: 'user',
      targetId: id,
      resource: `user:${id}`,
      result: 'ALLOWED',
      ipAddress: ip,
      previousValues: { status: target.status },
      newValues: { status: 'DISABLED' },
    });

    return { ok: true };
  }

  async deleteUser(actorId: string, id: string, ip?: string) {
    const target = await this.prisma.user.findUnique({
      where: { id },
      include: { role: { select: { id: true, name: true } } },
    });
    if (!target) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (id === actorId) {
      throw new BadRequestException('No puedes eliminar tu propia cuenta');
    }
    if (target.isSuperAdmin) {
      const totalSuperAdmins = await this.prisma.user.count({
        where: { isSuperAdmin: true },
      });
      if (totalSuperAdmins <= 1) {
        throw new ConflictException(
          'No es posible eliminar al último superadministrador del sistema',
        );
      }
      throw new BadRequestException(
        'La cuenta de superadministrador está protegida y no puede eliminarse desde este panel',
      );
    }

    await this.authService.revokeUserSessions(id);
    await this.prisma.user.delete({ where: { id } });

    await this.auditService.record({
      actorId,
      action: 'USER_DELETED',
      targetType: 'user',
      targetId: id,
      resource: `user:${id}`,
      result: 'ALLOWED',
      ipAddress: ip,
      previousValues: {
        email: target.email,
        name: target.name,
        roleId: target.roleId,
        roleName: target.role?.name ?? null,
        status: target.status,
      },
    });

    return { ok: true };
  }

  async listRoles() {
    return this.prisma.role.findMany({
      include: {
        _count: { select: { users: true } },
        permissions: {
          include: { module: true },
          orderBy: { module: { displayOrder: 'asc' } },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createRole(actorId: string, dto: CreateRoleDto, ip?: string) {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('El nombre del cargo es obligatorio');
    }
    if (isReservedRoleName(name)) {
      throw new BadRequestException(
        'No se puede crear un cargo con un nombre reservado para superadministración',
      );
    }

    const existingRoles = await this.prisma.role.findMany({ select: { id: true, name: true } });
    if (existingRoles.some((role) => normalizeText(role.name) === normalizeText(name))) {
      throw new ConflictException('Ya existe un cargo con ese nombre');
    }

    const role = await this.prisma.$transaction(async (tx) => {
      const created = await tx.role.create({
        data: {
          name,
          description: dto.description ?? null,
        },
      });
      const modules = await tx.module.findMany({ select: { id: true } });
      if (modules.length > 0) {
        await tx.permission.createMany({
          data: modules.map((mod) => ({
            roleId: created.id,
            moduleId: mod.id,
            canAccess: false,
            canRead: false,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            specialPermissions: [] as unknown as Prisma.InputJsonValue,
          })),
        });
      }
      return tx.role.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          _count: { select: { users: true } },
          permissions: { include: { module: true } },
        },
      });
    });

    await this.auditService.record({
      actorId,
      action: 'ROLE_CREATED',
      targetType: 'role',
      targetId: role.id,
      resource: `role:${role.id}`,
      result: 'ALLOWED',
      ipAddress: ip,
      newValues: { name: role.name, description: role.description },
    });

    return role;
  }

  async updateRole(actorId: string, id: string, dto: UpdateRoleDto, ip?: string) {
    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Cargo no encontrado');
    }

    const nextName = dto.name?.trim();
    if (nextName !== undefined) {
      if (!nextName) {
        throw new BadRequestException('El nombre del cargo es obligatorio');
      }
      if (isReservedRoleName(nextName)) {
        throw new BadRequestException(
          'No se puede asignar un nombre reservado para superadministración',
        );
      }
      const others = await this.prisma.role.findMany({
        where: { id: { not: id } },
        select: { id: true, name: true },
      });
      if (others.some((item) => normalizeText(item.name) === normalizeText(nextName))) {
        throw new ConflictException('Ya existe otro cargo con ese nombre');
      }
    }

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        ...(nextName !== undefined ? { name: nextName } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
      include: {
        _count: { select: { users: true } },
        permissions: { include: { module: true } },
      },
    });

    await this.auditService.record({
      actorId,
      action: 'ROLE_UPDATED',
      targetType: 'role',
      targetId: id,
      resource: `role:${id}`,
      result: 'ALLOWED',
      ipAddress: ip,
      previousValues: { name: existing.name, description: existing.description },
      newValues: { name: updated.name, description: updated.description },
    });

    return updated;
  }

  async deleteRole(actorId: string, id: string, ip?: string) {
    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Cargo no encontrado');
    }

    const assignedUsers = await this.prisma.user.count({ where: { roleId: id } });
    if (assignedUsers > 0) {
      throw new ConflictException(
        `No se puede eliminar el cargo "${existing.name}" porque sigue asignado a ${assignedUsers} usuario(s). Reasigna esos usuarios antes de eliminarlo.`,
      );
    }

    await this.prisma.role.delete({ where: { id } });

    await this.auditService.record({
      actorId,
      action: 'ROLE_DELETED',
      targetType: 'role',
      targetId: id,
      resource: `role:${id}`,
      result: 'ALLOWED',
      ipAddress: ip,
      previousValues: { name: existing.name, description: existing.description },
    });

    return { ok: true };
  }

  async updateRolePermissions(
    actorId: string,
    roleId: string,
    dto: UpdateRolePermissionsDto,
    ip?: string,
  ) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { module: true } } },
    });
    if (!role) {
      throw new NotFoundException('Cargo no encontrado');
    }

    const moduleIds = dto.permissions.map((item) => item.moduleId);
    const modules = await this.prisma.module.findMany({
      where: { id: { in: moduleIds } },
    });
    const moduleMap = new Map(modules.map((mod) => [mod.id, mod]));

    const normalizedEntries = dto.permissions.map((item) => {
      const mod = moduleMap.get(item.moduleId);
      if (!mod) {
        throw new BadRequestException(`El módulo ${item.moduleId} no existe`);
      }
      const normalized = this.authorization.normalizePermissionPayload(mod, item);
      return { moduleId: mod.id, moduleKey: mod.key, moduleName: mod.name, ...normalized };
    });

    const previousSnapshot = role.permissions.map((perm) => ({
      moduleKey: perm.module.key,
      canAccess: perm.canAccess,
      canRead: perm.canRead,
      canCreate: perm.canCreate,
      canUpdate: perm.canUpdate,
      canDelete: perm.canDelete,
      specialPermissions: parseSpecialPermissions(perm.specialPermissions),
    }));

    await this.prisma.$transaction(
      normalizedEntries.map((entry) =>
        this.prisma.permission.upsert({
          where: { roleId_moduleId: { roleId, moduleId: entry.moduleId } },
          create: {
            roleId,
            moduleId: entry.moduleId,
            canAccess: entry.canAccess,
            canRead: entry.canRead,
            canCreate: entry.canCreate,
            canUpdate: entry.canUpdate,
            canDelete: entry.canDelete,
            specialPermissions: entry.specialPermissions as unknown as Prisma.InputJsonValue,
          },
          update: {
            canAccess: entry.canAccess,
            canRead: entry.canRead,
            canCreate: entry.canCreate,
            canUpdate: entry.canUpdate,
            canDelete: entry.canDelete,
            specialPermissions: entry.specialPermissions as unknown as Prisma.InputJsonValue,
          },
        }),
      ),
    );

    await this.authService.revokeRoleSessions(roleId);

    const updatedRole = await this.prisma.role.findUniqueOrThrow({
      where: { id: roleId },
      include: {
        _count: { select: { users: true } },
        permissions: {
          include: { module: true },
          orderBy: { module: { displayOrder: 'asc' } },
        },
      },
    });

    await this.auditService.record({
      actorId,
      action: 'ROLE_PERMISSIONS_UPDATED',
      targetType: 'role',
      targetId: roleId,
      resource: `role:${roleId}`,
      result: 'ALLOWED',
      ipAddress: ip,
      previousValues: { roleName: role.name, permissions: previousSnapshot },
      newValues: {
        roleName: role.name,
        permissions: normalizedEntries.map((entry) => ({
          moduleKey: entry.moduleKey,
          canAccess: entry.canAccess,
          canRead: entry.canRead,
          canCreate: entry.canCreate,
          canUpdate: entry.canUpdate,
          canDelete: entry.canDelete,
          specialPermissions: entry.specialPermissions,
        })),
      },
    });

    return updatedRole;
  }

  async listModules() {
    return this.prisma.module.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async createModule(actorId: string, dto: CreateModuleDto, ip?: string) {
    const name = dto.name.trim();
    const key = slugifyModuleKey(dto.key ?? name);
    if (!name || !key) {
      throw new BadRequestException('El nombre y la clave del módulo son obligatorios');
    }

    const existing = await this.prisma.module.findMany({
      select: { id: true, key: true, name: true },
    });
    if (
      existing.some(
        (mod) => mod.key === key || normalizeText(mod.name) === normalizeText(name),
      )
    ) {
      throw new ConflictException('Ya existe un módulo con ese nombre o clave');
    }

    const specialActions = (dto.specialActions ?? []).map((item) => ({
      key: item.key,
      label: item.label,
      description: item.description ?? '',
    }));

    const created = await this.prisma.$transaction(async (tx) => {
      const mod = await tx.module.create({
        data: {
          key,
          name,
          description: dto.description ?? null,
          route: dto.route ?? `/gestion/modulo/${key}`,
          icon: dto.icon ?? 'layers',
          isImplemented: dto.isImplemented ?? false,
          isSystem: false,
          displayOrder: dto.displayOrder ?? existing.length + 1,
          supportsRead: dto.supportsRead ?? true,
          supportsCreate: dto.supportsCreate ?? true,
          supportsUpdate: dto.supportsUpdate ?? true,
          supportsDelete: dto.supportsDelete ?? true,
          specialActions: specialActions as unknown as Prisma.InputJsonValue,
        },
      });

      const roles = await tx.role.findMany({ select: { id: true } });
      if (roles.length > 0) {
        await tx.permission.createMany({
          data: roles.map((role) => ({
            roleId: role.id,
            moduleId: mod.id,
            canAccess: false,
            canRead: false,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            specialPermissions: [] as unknown as Prisma.InputJsonValue,
          })),
        });
      }
      return mod;
    });

    await this.auditService.record({
      actorId,
      action: 'MODULE_CREATED',
      targetType: 'module',
      targetId: created.id,
      resource: `module:${created.key}`,
      result: 'ALLOWED',
      ipAddress: ip,
      newValues: {
        key: created.key,
        name: created.name,
        route: created.route,
        supportsRead: created.supportsRead,
        supportsCreate: created.supportsCreate,
        supportsUpdate: created.supportsUpdate,
        supportsDelete: created.supportsDelete,
        specialActions,
      },
    });

    return created;
  }

  async updateModule(actorId: string, id: string, dto: UpdateModuleDto, ip?: string) {
    const existing = await this.prisma.module.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Módulo no encontrado');
    }

    const nextName = dto.name?.trim();
    if (nextName) {
      const others = await this.prisma.module.findMany({
        where: { id: { not: id } },
        select: { id: true, name: true },
      });
      if (others.some((item) => normalizeText(item.name) === normalizeText(nextName))) {
        throw new ConflictException('Ya existe otro módulo con ese nombre');
      }
    }

    const specialActions =
      dto.specialActions !== undefined
        ? dto.specialActions.map((item) => ({
            key: item.key,
            label: item.label,
            description: item.description ?? '',
          }))
        : undefined;

    const updated = await this.prisma.module.update({
      where: { id },
      data: {
        ...(nextName ? { name: nextName } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.isImplemented !== undefined ? { isImplemented: dto.isImplemented } : {}),
        ...(dto.displayOrder !== undefined ? { displayOrder: dto.displayOrder } : {}),
        ...(dto.supportsRead !== undefined ? { supportsRead: dto.supportsRead } : {}),
        ...(dto.supportsCreate !== undefined ? { supportsCreate: dto.supportsCreate } : {}),
        ...(dto.supportsUpdate !== undefined ? { supportsUpdate: dto.supportsUpdate } : {}),
        ...(dto.supportsDelete !== undefined ? { supportsDelete: dto.supportsDelete } : {}),
        ...(specialActions !== undefined
          ? { specialActions: specialActions as unknown as Prisma.InputJsonValue }
          : {}),
      },
    });

    // Si se deshabilita una capacidad CRUD en el módulo, limpiar permisos existentes y revocar sesiones
    const affectedPermissions = await this.prisma.permission.findMany({
      where: { moduleId: id },
    });
    const touchedRoleIds = new Set<string>();
    for (const perm of affectedPermissions) {
      const normalized = this.authorization.normalizePermissionPayload(updated, {}, perm);
      const prevSpecial = parseSpecialPermissions(perm.specialPermissions);
      const changed =
        normalized.canAccess !== perm.canAccess ||
        normalized.canRead !== perm.canRead ||
        normalized.canCreate !== perm.canCreate ||
        normalized.canUpdate !== perm.canUpdate ||
        normalized.canDelete !== perm.canDelete ||
        JSON.stringify(normalized.specialPermissions) !== JSON.stringify(prevSpecial);
      if (changed) {
        touchedRoleIds.add(perm.roleId);
        await this.prisma.permission.update({
          where: { id: perm.id },
          data: {
            canAccess: normalized.canAccess,
            canRead: normalized.canRead,
            canCreate: normalized.canCreate,
            canUpdate: normalized.canUpdate,
            canDelete: normalized.canDelete,
            specialPermissions:
              normalized.specialPermissions as unknown as Prisma.InputJsonValue,
          },
        });
      }
    }

    for (const roleId of touchedRoleIds) {
      await this.authService.revokeRoleSessions(roleId);
    }

    await this.auditService.record({
      actorId,
      action: 'MODULE_UPDATED',
      targetType: 'module',
      targetId: id,
      resource: `module:${updated.key}`,
      result: 'ALLOWED',
      ipAddress: ip,
      previousValues: {
        name: existing.name,
        description: existing.description,
        isImplemented: existing.isImplemented,
      },
      newValues: {
        name: updated.name,
        description: updated.description,
        isImplemented: updated.isImplemented,
      },
    });

    return updated;
  }

  async listPermissions() {
    return this.prisma.permission.findMany({
      include: { role: true, module: true },
      orderBy: [{ role: { name: 'asc' } }, { module: { displayOrder: 'asc' } }],
    });
  }

  async updatePermission(actorId: string, id: string, dto: UpdatePermissionDto, ip?: string) {
    const existing = await this.prisma.permission.findUnique({
      where: { id },
      include: { module: true, role: true },
    });
    if (!existing) {
      throw new NotFoundException('Permiso no encontrado');
    }

    const normalized = this.authorization.normalizePermissionPayload(
      existing.module,
      dto,
      existing,
    );

    const updated = await this.prisma.permission.update({
      where: { id },
      data: {
        canAccess: normalized.canAccess,
        canRead: normalized.canRead,
        canCreate: normalized.canCreate,
        canUpdate: normalized.canUpdate,
        canDelete: normalized.canDelete,
        specialPermissions: normalized.specialPermissions as unknown as Prisma.InputJsonValue,
      },
      include: { role: true, module: true },
    });

    await this.authService.revokeRoleSessions(existing.roleId);

    await this.auditService.record({
      actorId,
      action: 'PERMISSION_CHANGED',
      targetType: 'permission',
      targetId: id,
      resource: `role:${existing.roleId}:module:${existing.module.key}`,
      result: 'ALLOWED',
      ipAddress: ip,
      previousValues: {
        roleName: existing.role.name,
        moduleKey: existing.module.key,
        canAccess: existing.canAccess,
        canRead: existing.canRead,
        canCreate: existing.canCreate,
        canUpdate: existing.canUpdate,
        canDelete: existing.canDelete,
        specialPermissions: parseSpecialPermissions(existing.specialPermissions),
      },
      newValues: {
        roleName: existing.role.name,
        moduleKey: existing.module.key,
        canAccess: updated.canAccess,
        canRead: updated.canRead,
        canCreate: updated.canCreate,
        canUpdate: updated.canUpdate,
        canDelete: updated.canDelete,
        specialPermissions: normalized.specialPermissions,
      },
    });

    return updated;
  }

  async listAudit(query?: QueryAuditDto) {
    return this.prisma.auditEvent.findMany({
      where: {
        ...(query?.action ? { action: query.action } : {}),
        ...(query?.result ? { result: query.result } : {}),
        ...(query?.targetType ? { targetType: query.targetType } : {}),
      },
      include: {
        actor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: query?.limit ?? 200,
    });
  }
}
