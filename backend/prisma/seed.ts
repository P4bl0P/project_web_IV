import { PrismaClient, type Prisma } from '@prisma/client';
import '../src/env';
import { BUILT_IN_MODULES, INITIAL_ROLES } from '../src/authorization/module-registry';

const prisma = new PrismaClient();

async function main() {
  const modulesByKey = new Map<string, { id: string; key: string; specialActions: unknown }>();

  for (const mod of BUILT_IN_MODULES) {
    const specialActionsJson = mod.specialActions as unknown as Prisma.InputJsonValue;
    const saved = await prisma.module.upsert({
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
    });
    modulesByKey.set(saved.key, saved);
  }

  for (const roleDef of INITIAL_ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: {},
      create: {
        name: roleDef.name,
        description: roleDef.description,
      },
    });

    for (const modDef of BUILT_IN_MODULES) {
      const mod = modulesByKey.get(modDef.key);
      if (!mod) continue;

      const isOwnDefaultModule = roleDef.defaultModuleKey === modDef.key;

      await prisma.permission.upsert({
        where: { roleId_moduleId: { roleId: role.id, moduleId: mod.id } },
        update: {},
        create: {
          roleId: role.id,
          moduleId: mod.id,
          canAccess: isOwnDefaultModule,
          canRead: isOwnDefaultModule && modDef.supportsRead,
          canCreate: isOwnDefaultModule && modDef.supportsCreate,
          canUpdate: isOwnDefaultModule && modDef.supportsUpdate,
          canDelete: isOwnDefaultModule && modDef.supportsDelete,
          specialPermissions: [] as unknown as Prisma.InputJsonValue,
        },
      });
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
