import { PrismaClient } from '@prisma/client';
import '../src/env';
const prisma = new PrismaClient();
async function main() {
  const moduleNames = ['Jefatura', 'Secretaría', 'Tesorería'];
  const roleNames = ['Jefatura', 'Secretaría', 'Tesorería'];
  const modules = await Promise.all(moduleNames.map((name) => prisma.module.upsert({ where: { name }, update: {}, create: { name } })));
  const roles = await Promise.all(roleNames.map((name) => prisma.role.upsert({ where: { name }, update: {}, create: { name } })));
  for (const role of roles) for (const module of modules) {
    await prisma.permission.upsert({
      where: { roleId_moduleId: { roleId: role.id, moduleId: module.id } },
      update: {}, create: { roleId: role.id, moduleId: module.id },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
