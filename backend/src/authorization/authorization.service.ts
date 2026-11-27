import {
  ForbiddenException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PermissionRequirement } from './authorization.decorators';
import {
  BUILT_IN_MODULES,
  hasModulePermission,
  isSuperAdminUser,
  type AuthorizedUser,
} from './module-registry';

export interface PermissionInput {
  canAccess?: boolean;
  canRead?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  specialPermissions?: string[];
}

export interface ModuleCapabilitiesRow {
  supportsRead: boolean;
  supportsCreate: boolean;
  supportsUpdate: boolean;
  supportsDelete: boolean;
  specialActions: unknown;
}

@Injectable()
export class AuthorizationService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.syncBuiltInModules();
  }

  async syncBuiltInModules(): Promise<void> {
    if (
      !this.prisma.module?.upsert ||
      !this.prisma.role?.findMany ||
      !this.prisma.permission?.upsert
    ) {
      return;
    }

    const syncedModules: Array<{ id: string }> = [];
    for (const mod of BUILT_IN_MODULES) {
      const specialActionsJson = mod.specialActions as unknown as Prisma.InputJsonValue;
      const saved = await this.prisma.module.upsert({
        where: { key: mod.key },
        update: {
          name: mod.name,
          description: mod.description,
          route: mod.route,
          icon: mod.icon,
          isImplemented: mod.isImplemented,
          isSystem: mod.isSystem,
          displayOrder: mod.displayOrder,
          supportsRead: mod.supportsRead,
          supportsCreate: mod.supportsCreate,
          supportsUpdate: mod.supportsUpdate,
          supportsDelete: mod.supportsDelete,
          specialActions: specialActionsJson,
        },
        create: {
          key: mod.key,
          name: mod.name,
          description: mod.description,
          route: mod.route,
          icon: mod.icon,
          isImplemented: mod.isImplemented,
          isSystem: mod.isSystem,
          displayOrder: mod.displayOrder,
          supportsRead: mod.supportsRead,
          supportsCreate: mod.supportsCreate,
          supportsUpdate: mod.supportsUpdate,
          supportsDelete: mod.supportsDelete,
          specialActions: specialActionsJson,
        },
        select: { id: true },
      });
      syncedModules.push(saved);
    }

    const roles = await this.prisma.role.findMany({ select: { id: true } });
    const permissionUpserts = roles.flatMap((role) =>
      syncedModules.map((mod) =>
        this.prisma.permission.upsert({
          where: { roleId_moduleId: { roleId: role.id, moduleId: mod.id } },
          update: {},
          create: {
            roleId: role.id,
            moduleId: mod.id,
            canAccess: false,
            canRead: false,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            specialPermissions: [] as unknown as Prisma.InputJsonValue,
          },
        }),
      ),
    );
    if (permissionUpserts.length > 0) {
      if (typeof this.prisma.$transaction === 'function') {
        await this.prisma.$transaction(permissionUpserts);
      } else {
        await Promise.all(permissionUpserts);
      }
    }
  }

  assertSuperAdmin(user: AuthorizedUser | null | undefined): void {
    if (!user) {
      throw new UnauthorizedException('Sesión no válida o caducada');
    }
    if (!isSuperAdminUser(user)) {
      throw new ForbiddenException('Solo el superadministrador puede realizar esta operación');
    }
  }

  assertPermission(
    user: AuthorizedUser | null | undefined,
    requirement: PermissionRequirement,
  ): void {
    if (!user) {
      throw new UnauthorizedException('Sesión no válida o caducada');
    }
    if (isSuperAdminUser(user)) return;

    if (!hasModulePermission(user, requirement.moduleKey, requirement.action)) {
      throw new ForbiddenException('Operación no autorizada para tu cargo actual');
    }
  }

  async listRegisteredModules() {
    if (!this.prisma.module?.findMany) {
      return [...BUILT_IN_MODULES];
    }
    const rows = await this.prisma.module.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.length > 0 ? rows : [...BUILT_IN_MODULES];
  }

  normalizePermissionPayload(
    moduleRecord: ModuleCapabilitiesRow,
    input: PermissionInput,
    current?: {
      canAccess: boolean;
      canRead: boolean;
      canCreate: boolean;
      canUpdate: boolean;
      canDelete: boolean;
      specialPermissions: unknown;
    },
  ) {
    if (input.canAccess === false) {
      return {
        canAccess: false,
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        specialPermissions: [] as string[],
      };
    }

    const canCreate = moduleRecord.supportsCreate
      ? Boolean(input.canCreate ?? current?.canCreate ?? false)
      : false;
    const canUpdate = moduleRecord.supportsUpdate
      ? Boolean(input.canUpdate ?? current?.canUpdate ?? false)
      : false;
    const canDelete = moduleRecord.supportsDelete
      ? Boolean(input.canDelete ?? current?.canDelete ?? false)
      : false;
    const canRead = moduleRecord.supportsRead
      ? Boolean(input.canRead ?? current?.canRead ?? false) || canCreate || canUpdate || canDelete
      : false;

    const hasAnyCrud = canRead || canCreate || canUpdate || canDelete;

    return {
      canAccess: hasAnyCrud,
      canRead: hasAnyCrud ? canRead : false,
      canCreate: hasAnyCrud ? canCreate : false,
      canUpdate: hasAnyCrud ? canUpdate : false,
      canDelete: hasAnyCrud ? canDelete : false,
      specialPermissions: [] as string[],
    };
  }
}
