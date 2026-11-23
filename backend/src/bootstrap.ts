import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import './env';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 15 || password.trim().length < 12) {
    throw new Error(
      'ADMIN_EMAIL and ADMIN_PASSWORD (minimum 15 characters, non-whitespace) are required',
    );
  }
  if (await prisma.user.count({ where: { isSuperAdmin: true } })) {
    throw new Error('The absolute administrator already exists');
  }

  const created = await prisma.user.create({
    data: {
      email,
      name: process.env.ADMIN_NAME?.trim() || 'Administrador',
      passwordHash: await argon2.hash(password),
      isSuperAdmin: true,
      status: 'ACTIVE',
    },
  });

  await prisma.auditEvent.create({
    data: {
      actorId: created.id,
      action: 'SUPERADMIN_BOOTSTRAPPED',
      targetType: 'user',
      targetId: created.id,
      resource: `user:${created.id}`,
      result: 'ALLOWED',
      newValues: { email: created.email, isSuperAdmin: true },
    },
  });
}

void main()
  .catch((error: unknown) => {
    console.error('Bootstrap failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
