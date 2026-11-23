import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import './env';

const prisma = new PrismaClient();

async function main() {
  if (process.env.RECOVERY_CONFIRM !== 'YES') {
    throw new Error('Set RECOVERY_CONFIRM=YES to run administrative superadmin recovery');
  }

  const email = process.env.RECOVERY_ADMIN_EMAIL?.trim().toLowerCase();
  const newPassword = process.env.RECOVERY_NEW_PASSWORD;
  const resetMfa = process.env.RECOVERY_RESET_MFA === 'true';

  if (!email || !newPassword || newPassword.length < 15 || newPassword.trim().length < 12) {
    throw new Error(
      'RECOVERY_ADMIN_EMAIL and RECOVERY_NEW_PASSWORD (minimum 15 characters) are required',
    );
  }

  const passwordHash = await argon2.hash(newPassword);
  const now = new Date();

  const existingSuperAdmins = await prisma.user.findMany({
    where: { isSuperAdmin: true },
    orderBy: { createdAt: 'asc' },
  });

  const matchingTarget =
    existingSuperAdmins.find((user) => user.email === email) ?? existingSuperAdmins[0] ?? null;

  if (!matchingTarget) {
    const conflict = await prisma.user.findUnique({ where: { email } });
    if (conflict) {
      throw new Error(
        `Cannot create recovery superadmin: email ${email} already belongs to a non-superadmin account`,
      );
    }
    const created = await prisma.user.create({
      data: {
        email,
        name: process.env.ADMIN_NAME?.trim() || 'Administrador',
        passwordHash,
        isSuperAdmin: true,
        status: 'ACTIVE',
        mustChangePassword: false,
      },
    });
    await prisma.auditEvent.create({
      data: {
        actorId: created.id,
        action: 'SUPERADMIN_RECOVERY',
        targetType: 'user',
        targetId: created.id,
        resource: `user:${created.id}`,
        result: 'ALLOWED',
        newValues: { createdEmergencyAccount: true, email: created.email },
      },
    });
    console.log(`Emergency superadmin created for ${created.email}`);
    return;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: matchingTarget.id },
      data: {
        email,
        passwordHash,
        status: 'ACTIVE',
        mustChangePassword: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
        ...(resetMfa
          ? { mfaSecret: null, mfaPendingSecret: null, mfaConfiguredAt: null }
          : {}),
      },
    }),
    prisma.session.updateMany({
      where: { userId: matchingTarget.id, revokedAt: null },
      data: { revokedAt: now },
    }),
    prisma.mfaChallenge.updateMany({
      where: { userId: matchingTarget.id, consumedAt: null },
      data: { consumedAt: now },
    }),
    ...(resetMfa ? [prisma.recoveryCode.deleteMany({ where: { userId: matchingTarget.id } })] : []),
    prisma.auditEvent.create({
      data: {
        actorId: matchingTarget.id,
        action: 'SUPERADMIN_RECOVERY',
        targetType: 'user',
        targetId: matchingTarget.id,
        resource: `user:${matchingTarget.id}`,
        result: 'ALLOWED',
        newValues: { email, resetMfa, reactivated: true },
      },
    }),
  ]);

  console.log(`Superadmin account recovered for ${email} (resetMfa=${String(resetMfa)})`);
}

void main()
  .catch((error: unknown) => {
    console.error('Superadmin recovery failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
