import {
  BadRequestException,
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
  hasSpecialPermission,
  isSuperAdminUser,
  parseSpecialPermissions,
  type AuthorizedUser,
  type SpecialActionDefinition,
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
    for (const role of roles) {
      for (const mod of syncedModules) {
        await this.prisma.permission.upsert({
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
        });
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

    if (
      requirement.specialAction &&
      !hasSpecialPermission(user, requirement.moduleKey, requirement.specialAction)
    ) {
      throw new ForbiddenException('Tu cargo no dispone del permiso especial requerido');
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

  extractModuleSpecialKeys(specialActions: unknown): Set<string> {
    if (!Array.isArray(specialActions)) return new Set();
    const keys = new Set<string>();
    for (const item of specialActions) {
      if (item && typeof item === 'object' && 'key' in item) {
        const key = (item as SpecialActionDefinition).key;
        if (typeof key === 'string' && key.trim()) {
          keys.add(key.trim());
        }
      }
    }
    return keys;
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
    const allowedSpecialKeys = this.extractModuleSpecialKeys(moduleRecord.specialActions);
    const requestedSpecial =
      input.specialPermissions !== undefined
        ? input.specialPermissions
        : parseSpecialPermissions(current?.specialPermissions);

    const uniqueSpecial: string[] = [];
    for (const key of requestedSpecial) {
      const trimmed = key.trim();
      if (!trimmed) continue;
      if (!allowedSpecialKeys.has(trimmed)) {
        throw new BadRequestException(
          `El permiso especial "${trimmed}" no pertenece a este módulo`,
        );
      }
      if (!uniqueSpecial.includes(trimmed)) {
        uniqueSpecial.push(trimmed);
      }
    }

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

    const canRead = moduleRecord.supportsRead
      ? Boolean(input.canRead ?? current?.canRead ?? false)
      : false;
    const canCreate = moduleRecord.supportsCreate
      ? Boolean(input.canCreate ?? current?.canCreate ?? false)
      : false;
    const canUpdate = moduleRecord.supportsUpdate
      ? Boolean(input.canUpdate ?? current?.canUpdate ?? false)
      : false;
    const canDelete = moduleRecord.supportsDelete
      ? Boolean(input.canDelete ?? current?.canDelete ?? false)
      : false;

    const hasAnyCapability =
      canRead || canCreate || canUpdate || canDelete || uniqueSpecial.length > 0;
    const canAccess =
      input.canAccess !== undefined
        ? Boolean(input.canAccess)
        : Boolean(current?.canAccess || hasAnyCapability);

    if (!canAccess) {
      return {
        canAccess: false,
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        specialPermissions: [] as string[],
      };
    }

    return {
      canAccess: true,
      canRead,
      canCreate,
      canUpdate,
      canDelete,
      specialPermissions: uniqueSpecial,
    };
  }
}
