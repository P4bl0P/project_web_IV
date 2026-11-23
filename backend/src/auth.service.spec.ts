import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { jest } from '@jest/globals';
import * as argon2 from 'argon2';

jest.setTimeout(60_000);
import { generateSync } from 'otplib';
import { AuthService } from './auth.service';
import type { PrismaService } from './prisma/prisma.service';

interface UserRow {
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

interface MfaChallengeRow {
  id: string;
  tokenHash: string;
  userId: string;
  purpose: string;
  attempts: number;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

interface SessionRow {
  id: string;
  tokenHash: string;
  userId: string;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

interface RecoveryCodeRow {
  id: string;
  codeHash: string;
  userId: string;
  usedAt: Date | null;
  createdAt: Date;
}

describe('AuthService - Seguridad de sesiones, aislamiento MFA y fuerza bruta', () => {
  let service: AuthService;
  let users: UserRow[];
  let challenges: MfaChallengeRow[];
  let sessions: SessionRow[];
  let recoveryCodes: RecoveryCodeRow[];
  let auditEvents: Array<Record<string, unknown>>;

  let basePasswordHash: string;

  beforeAll(async () => {
    process.env.MFA_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString('base64');
    basePasswordHash = await argon2.hash('ClaveSeguraInicial12345!');
  });

  beforeEach(() => {
    const passwordHash = basePasswordHash;
    users = [
      {
        id: 'u-1',
        email: 'secretaria@example.org',
        name: 'Usuaria Secretaría',
        passwordHash,
        status: 'ACTIVE',
        isSuperAdmin: false,
        mustChangePassword: false,
        mfaSecret: null,
        mfaPendingSecret: null,
        mfaConfiguredAt: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        roleId: 'role-sec',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    challenges = [];
    sessions = [];
    recoveryCodes = [];
    auditEvents = [];

    const prismaMock: Record<string, unknown> = {
      user: {
        findUnique: async ({ where }: { where: { id?: string; email?: string } }) =>
          users.find(
            (u) => (where.id && u.id === where.id) || (where.email && u.email === where.email),
          ) ?? null,
        update: async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<UserRow>;
        }) => {
          const user = users.find((u) => u.id === where.id)!;
          Object.assign(user, data, { updatedAt: new Date() });
          return { ...user };
        },
      },
      mfaChallenge: {
        create: async ({ data }: { data: Omit<MfaChallengeRow, 'id' | 'attempts' | 'consumedAt' | 'createdAt'> }) => {
          const row: MfaChallengeRow = {
            id: `ch-${challenges.length + 1}`,
            attempts: 0,
            consumedAt: null,
            createdAt: new Date(),
            ...data,
          };
          challenges.push(row);
          return row;
        },
        findUnique: async ({ where }: { where: { tokenHash: string } }) => {
          const row = challenges.find((c) => c.tokenHash === where.tokenHash);
          if (!row) return null;
          const user = users.find((u) => u.id === row.userId)!;
          return { ...row, user };
        },
        update: async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<MfaChallengeRow>;
        }) => {
          const row = challenges.find((c) => c.id === where.id)!;
          Object.assign(row, data);
          return row;
        },
        updateMany: async ({
          where,
          data,
        }: {
          where: { id?: string; userId?: string; consumedAt?: null };
          data: Partial<MfaChallengeRow>;
        }) => {
          let count = 0;
          for (const row of challenges) {
            if (where.id && row.id !== where.id) continue;
            if (where.userId && row.userId !== where.userId) continue;
            if (where.consumedAt === null && row.consumedAt !== null) continue;
            Object.assign(row, data);
            count += 1;
          }
          return { count };
        },
      },
      session: {
        create: async ({ data }: { data: Omit<SessionRow, 'id' | 'createdAt' | 'revokedAt'> }) => {
          const row: SessionRow = {
            id: `sess-${sessions.length + 1}`,
            createdAt: new Date(),
            revokedAt: null,
            ...data,
          };
          sessions.push(row);
          return row;
        },
        findUnique: async ({ where }: { where: { tokenHash: string } }) => {
          const row = sessions.find((s) => s.tokenHash === where.tokenHash);
          if (!row) return null;
          const user = users.find((u) => u.id === row.userId)!;
          return { ...row, user: { ...user, role: null } };
        },
        update: async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<SessionRow>;
        }) => {
          const row = sessions.find((s) => s.id === where.id)!;
          Object.assign(row, data);
          return row;
        },
        updateMany: async ({
          where,
          data,
        }: {
          where: { userId?: string; tokenHash?: string; revokedAt?: null };
          data: Partial<SessionRow>;
        }) => {
          let count = 0;
          for (const row of sessions) {
            if (where.userId && row.userId !== where.userId) continue;
            if (where.tokenHash && row.tokenHash !== where.tokenHash) continue;
            if (where.revokedAt === null && row.revokedAt !== null) continue;
            Object.assign(row, data);
            count += 1;
          }
          return { count };
        },
      },
      recoveryCode: {
        findMany: async ({ where }: { where: { userId: string; usedAt: null } }) =>
          recoveryCodes.filter((rc) => rc.userId === where.userId && rc.usedAt === null),
        deleteMany: async ({ where }: { where: { userId: string } }) => {
          const before = recoveryCodes.length;
          recoveryCodes = recoveryCodes.filter((rc) => rc.userId !== where.userId);
          return { count: before - recoveryCodes.length };
        },
        createMany: async ({ data }: { data: Array<{ userId: string; codeHash: string }> }) => {
          for (const item of data) {
            recoveryCodes.push({
              id: `rc-${recoveryCodes.length + 1}`,
              userId: item.userId,
              codeHash: item.codeHash,
              usedAt: null,
              createdAt: new Date(),
            });
          }
          return { count: data.length };
        },
        updateMany: async ({
          where,
          data,
        }: {
          where: { id: string; usedAt: null };
          data: Partial<RecoveryCodeRow>;
        }) => {
          let count = 0;
          for (const rc of recoveryCodes) {
            if (rc.id === where.id && rc.usedAt === null) {
              Object.assign(rc, data);
              count += 1;
            }
          }
          return { count };
        },
      },
      auditEvent: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          auditEvents.push(data);
          return data;
        },
      },
      $transaction: async (input: unknown) => {
        if (typeof input === 'function') {
          return (input as (tx: Record<string, unknown>) => Promise<unknown>)(prismaMock);
        }
        return Promise.all(input as Array<Promise<unknown>>);
      },
    };

    service = new AuthService(prismaMock as unknown as PrismaService);
  });

  it('aisla el challenge pre-MFA en MfaChallenge e impide usarlo como cookie de sesión', async () => {
    const loginResult = await service.login(
      'secretaria@example.org',
      'ClaveSeguraInicial12345!',
      '127.0.0.1',
    );

    expect(loginResult.status).toBe('MFA_SETUP_REQUIRED');
    expect(loginResult.setup?.secret).toBeTruthy();
    expect(challenges).toHaveLength(1);
    expect(sessions).toHaveLength(0);

    // El secreto activo no debe sobrescribirse todavía; se mantiene en mfaPendingSecret
    expect(users[0].mfaSecret).toBeNull();
    expect(users[0].mfaPendingSecret).toBeTruthy();

    // Intentar usar el challenge directamente como token de sesión devuelve null
    const sessionUser = await service.getUserBySession(loginResult.challenge);
    expect(sessionUser).toBeNull();
  });

  it('completa setup MFA, emite sesión real y permite login posterior con TOTP y código de recuperación de un solo uso', async () => {
    const setupLogin = await service.login(
      'secretaria@example.org',
      'ClaveSeguraInicial12345!',
    );
    const secret = setupLogin.setup!.secret;
    const totp = generateSync({ secret });

    const confirmed = await service.confirmMfaChallenge(setupLogin.challenge, totp, '10.0.0.1');
    expect(confirmed.token).toBeTruthy();
    expect(confirmed.codes).toHaveLength(10);
    expect(users[0].mfaConfiguredAt).toBeInstanceOf(Date);
    expect(users[0].mfaPendingSecret).toBeNull();

    // No se puede reutilizar el mismo challenge de setup
    await expect(service.confirmMfaChallenge(setupLogin.challenge, totp)).rejects.toThrow(
      UnauthorizedException,
    );

    // La sesión emitida sí autentica
    const activeUser = await service.getUserBySession(confirmed.token);
    expect(activeUser?.id).toBe('u-1');

    // Nuevo login con código de recuperación de un solo uso
    const secondLogin = await service.login(
      'secretaria@example.org',
      'ClaveSeguraInicial12345!',
    );
    expect(secondLogin.status).toBe('MFA_REQUIRED');
    const recoveryCode = confirmed.codes[0];
    const secondSessionToken = await service.completeMfa(secondLogin.challenge, recoveryCode);
    expect(secondSessionToken).toBeTruthy();

    // El mismo código de recuperación ya consumido no vuelve a servir
    const thirdLogin = await service.login(
      'secretaria@example.org',
      'ClaveSeguraInicial12345!',
    );
    await expect(service.completeMfa(thirdLogin.challenge, recoveryCode)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('bloquea la cuenta tras 5 intentos fallidos de contraseña e invalida el reto MFA tras 5 fallos', async () => {
    for (let i = 0; i < 4; i++) {
      await expect(
        service.login('secretaria@example.org', 'Incorrecta123456789'),
      ).rejects.toThrow(UnauthorizedException);
      expect(users[0].lockedUntil).toBeNull();
    }

    await expect(
      service.login('secretaria@example.org', 'Incorrecta123456789'),
    ).rejects.toThrow(UnauthorizedException);
    expect(users[0].lockedUntil).toBeInstanceOf(Date);

    // Incluso con la contraseña correcta, permanece bloqueado hasta que pase lockedUntil
    await expect(
      service.login('secretaria@example.org', 'ClaveSeguraInicial12345!'),
    ).rejects.toThrow(UnauthorizedException);

    // Desbloquear manualmente y probar 5 códigos MFA erróneos
    users[0].lockedUntil = null;
    users[0].failedLoginAttempts = 0;
    const setupLogin = await service.login(
      'secretaria@example.org',
      'ClaveSeguraInicial12345!',
    );
    for (let i = 0; i < 5; i++) {
      await expect(service.confirmMfaChallenge(setupLogin.challenge, '000000')).rejects.toThrow(
        BadRequestException,
      );
    }
    expect(challenges[0].consumedAt).toBeInstanceOf(Date);
    await expect(
      service.confirmMfaChallenge(setupLogin.challenge, generateSync({ secret: setupLogin.setup!.secret })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('impide reactivar usuarios desactivados en confirmMfaChallenge y rechaza sus sesiones', async () => {
    const setupLogin = await service.login(
      'secretaria@example.org',
      'ClaveSeguraInicial12345!',
    );
    const totp = generateSync({ secret: setupLogin.setup!.secret });

    // Si un administrador desactiva la cuenta antes de confirmar MFA
    users[0].status = 'DISABLED';
    await expect(service.confirmMfaChallenge(setupLogin.challenge, totp)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(users[0].status).toBe('DISABLED');

    // Si se reactiva, completa MFA y luego se desactiva, su sesión muere inmediatamente
    users[0].status = 'ACTIVE';
    const confirmed = await service.confirmMfaChallenge(setupLogin.challenge, totp);
    expect(await service.getUserBySession(confirmed.token)).not.toBeNull();

    users[0].status = 'DISABLED';
    expect(await service.getUserBySession(confirmed.token)).toBeNull();
  });

  it('rota la sesión al cambiar contraseña e invalida las anteriores; exige contraseña actual para reconfigurar MFA', async () => {
    const setupLogin = await service.login(
      'secretaria@example.org',
      'ClaveSeguraInicial12345!',
    );
    const totp = generateSync({ secret: setupLogin.setup!.secret });
    const confirmed = await service.confirmMfaChallenge(setupLogin.challenge, totp);

    const changed = await service.changePassword(
      'u-1',
      'ClaveSeguraInicial12345!',
      'NuevaClaveSegura987654!',
      '127.0.0.1',
    );
    expect(changed.ok).toBe(true);
    expect(changed.token).not.toBe(confirmed.token);
    expect(await service.getUserBySession(confirmed.token)).toBeNull();
    expect(await service.getUserBySession(changed.token)).not.toBeNull();

    // Reconfigurar MFA sin contraseña actual debe rechazarse sin romper mfaSecret
    await expect(service.setupMfa('u-1')).rejects.toThrow(UnauthorizedException);
    const reSetup = await service.setupMfa('u-1', 'NuevaClaveSegura987654!');
    expect(reSetup.secret).toBeTruthy();
    expect(auditEvents.some((ev) => ev.action === 'PASSWORD_CHANGED')).toBe(true);
  });
});
