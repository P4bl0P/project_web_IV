import {
  BadRequestException,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { AuditService } from './audit/audit.service';
import { AuthorizationService } from './authorization/authorization.service';
import { PrismaService } from './prisma/prisma.service';

export const sessionCookie = 'scout_session';
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_DURATION_MS = 15 * 60_000;
const CHALLENGE_TTL_MS = 300_000;
const MAX_MFA_ATTEMPTS = 5;

const tokenHash = (value: string) => createHash('sha256').update(value).digest('hex');

let dummyHashPromise: Promise<string> | null = null;
function getDummyPasswordHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = argon2.hash(randomBytes(32).toString('hex'));
  }
  return dummyHashPromise;
}

@Injectable()
export class AuthService {
  private readonly idleMs = Number(process.env.SESSION_IDLE_MS ?? 900_000);
  private readonly maxMs = Number(process.env.SESSION_MAX_MS ?? 28_800_000);
  private readonly auditService: AuditService;
  private readonly authorization: AuthorizationService;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() auditService?: AuditService,
    @Optional() authorization?: AuthorizationService,
  ) {
    this.auditService = auditService ?? new AuditService(prisma);
    this.authorization = authorization ?? new AuthorizationService(prisma);
  }

  getSessionMaxMs(): number {
    return this.maxMs;
  }

  validatePasswordPolicy(password: string): void {
    if (typeof password !== 'string' || password.length < 15) {
      throw new BadRequestException('La contraseña debe tener al menos 15 caracteres');
    }
    if (password.length > 128) {
      throw new BadRequestException('La contraseña no puede superar los 128 caracteres');
    }
    if (password.trim().length < 12) {
      throw new BadRequestException('La contraseña no puede basarse en espacios en blanco');
    }
  }

  async login(email: string, password: string, ip?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      await argon2.verify(await getDummyPasswordHash(), password).catch(() => false);
      await this.auditService.record({
        actorId: null,
        action: 'LOGIN_FAILED',
        targetType: 'user',
        resource: normalizedEmail,
        result: 'DENIED',
        ipAddress: ip,
      });
      throw new UnauthorizedException('Credenciales no válidas');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await argon2.verify(user.passwordHash, password).catch(() => false);
      await this.auditService.record({
        actorId: user.id,
        action: 'LOGIN_LOCKED',
        targetType: 'user',
        targetId: user.id,
        resource: normalizedEmail,
        result: 'DENIED',
        ipAddress: ip,
      });
      throw new UnauthorizedException(
        'Demasiados intentos fallidos. Espera unos minutos antes de volver a intentarlo.',
      );
    }

    const passwordValid = await argon2.verify(user.passwordHash, password).catch(() => false);
    if (!passwordValid) {
      const nextAttempts = (user.failedLoginAttempts ?? 0) + 1;
      const shouldLock = nextAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: nextAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + LOGIN_LOCK_DURATION_MS) : null,
        },
      });
      await this.auditService.record({
        actorId: user.id,
        action: shouldLock ? 'LOGIN_LOCKED' : 'LOGIN_FAILED',
        targetType: 'user',
        targetId: user.id,
        resource: normalizedEmail,
        result: 'DENIED',
        ipAddress: ip,
        newValues: { failedLoginAttempts: nextAttempts, locked: shouldLock },
      });
      throw new UnauthorizedException('Credenciales no válidas');
    }

    if (user.status !== 'ACTIVE') {
      await this.auditService.record({
        actorId: user.id,
        action: 'LOGIN_DENIED_INACTIVE',
        targetType: 'user',
        targetId: user.id,
        resource: normalizedEmail,
        result: 'DENIED',
        ipAddress: ip,
        newValues: { status: user.status },
      });
      throw new UnauthorizedException('Credenciales no válidas');
    }

    const challenge = randomBytes(32).toString('base64url');
    const needsSetup = !user.mfaConfiguredAt || !user.mfaSecret;
    let setup: { secret: string; otpauthUrl: string } | undefined;
    let pendingEncryptedSecret: string | undefined;

    if (needsSetup) {
      const secret = generateSecret();
      pendingEncryptedSecret = this.encrypt(secret);
      setup = {
        secret,
        otpauthUrl: generateURI({ issuer: 'Grupo Scout', label: user.email, secret }),
      };
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          ...(pendingEncryptedSecret ? { mfaPendingSecret: pendingEncryptedSecret } : {}),
        },
      }),
      this.prisma.mfaChallenge.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: new Date() },
      }),
      this.prisma.mfaChallenge.create({
        data: {
          tokenHash: tokenHash(challenge),
          userId: user.id,
          purpose: needsSetup ? 'SETUP' : 'LOGIN',
          expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
        },
      }),
    ]);

    return {
      status: needsSetup ? ('MFA_SETUP_REQUIRED' as const) : ('MFA_REQUIRED' as const),
      challenge,
      setup,
    };
  }

  async confirmMfaChallenge(challenge: string, code: string, ip?: string) {
    const pending = await this.prisma.mfaChallenge.findUnique({
      where: { tokenHash: tokenHash(challenge) },
      include: { user: true },
    });

    if (
      !pending ||
      pending.consumedAt ||
      pending.expiresAt < new Date() ||
      pending.purpose !== 'SETUP' ||
      pending.attempts >= MAX_MFA_ATTEMPTS ||
      pending.user.status !== 'ACTIVE' ||
      Boolean(pending.user.mfaConfiguredAt)
    ) {
      throw new UnauthorizedException('Sesión de autenticación no válida');
    }

    const encryptedSecret = pending.user.mfaPendingSecret ?? pending.user.mfaSecret;
    if (!encryptedSecret) {
      throw new UnauthorizedException('Sesión de autenticación no válida');
    }

    const valid = verifySync({
      token: code.trim(),
      secret: this.decrypt(encryptedSecret),
    }).valid;

    if (!valid) {
      const nextAttempts = pending.attempts + 1;
      await this.prisma.mfaChallenge.update({
        where: { id: pending.id },
        data: {
          attempts: nextAttempts,
          ...(nextAttempts >= MAX_MFA_ATTEMPTS ? { consumedAt: new Date() } : {}),
        },
      });
      await this.auditService.record({
        actorId: pending.userId,
        action: 'MFA_SETUP_FAILED',
        targetType: 'user',
        targetId: pending.userId,
        resource: 'mfa',
        result: 'DENIED',
        ipAddress: ip,
      });
      throw new BadRequestException('Código MFA no válido');
    }

    const codes = Array.from({ length: 10 }, () =>
      randomBytes(5).toString('hex').toUpperCase(),
    );
    const hashedCodes = await Promise.all(
      codes.map(async (value) => ({ userId: pending.userId, codeHash: await argon2.hash(value) })),
    );
    const sessionToken = randomBytes(32).toString('base64url');
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.mfaChallenge.updateMany({
        where: { id: pending.id, consumedAt: null },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) {
        throw new UnauthorizedException('Sesión de autenticación no válida');
      }

      await tx.user.update({
        where: { id: pending.userId },
        data: {
          mfaSecret: encryptedSecret,
          mfaPendingSecret: null,
          mfaConfiguredAt: now,
        },
      });

      await tx.recoveryCode.deleteMany({ where: { userId: pending.userId } });
      await tx.recoveryCode.createMany({ data: hashedCodes });
      await tx.session.create({
        data: {
          tokenHash: tokenHash(sessionToken),
          userId: pending.userId,
          expiresAt: new Date(Date.now() + this.maxMs),
          lastSeenAt: now,
        },
      });
    });

    await this.auditService.record({
      actorId: pending.userId,
      action: 'MFA_SETUP_COMPLETED',
      targetType: 'user',
      targetId: pending.userId,
      resource: 'mfa',
      result: 'ALLOWED',
      ipAddress: ip,
    });
    await this.auditService.record({
      actorId: pending.userId,
      action: 'LOGIN_SUCCESS',
      targetType: 'session',
      targetId: pending.userId,
      resource: 'session',
      result: 'ALLOWED',
      ipAddress: ip,
    });

    return { token: sessionToken, codes };
  }

  async completeMfa(challenge: string, code: string, ip?: string) {
    const pending = await this.prisma.mfaChallenge.findUnique({
      where: { tokenHash: tokenHash(challenge) },
      include: { user: true },
    });

    if (
      !pending ||
      pending.consumedAt ||
      pending.expiresAt < new Date() ||
      pending.purpose !== 'LOGIN' ||
      pending.attempts >= MAX_MFA_ATTEMPTS ||
      pending.user.status !== 'ACTIVE' ||
      !pending.user.mfaConfiguredAt ||
      !pending.user.mfaSecret
    ) {
      throw new UnauthorizedException('Sesión de autenticación no válida');
    }

    const trimmedCode = code.trim();
    let valid = verifySync({
      token: trimmedCode,
      secret: this.decrypt(pending.user.mfaSecret),
    }).valid;
    let matchedRecoveryCodeId: string | null = null;

    if (!valid) {
      const upperCode = trimmedCode.toUpperCase();
      const recoveryCodes = await this.prisma.recoveryCode.findMany({
        where: { userId: pending.userId, usedAt: null },
      });
      for (const recoveryCode of recoveryCodes) {
        const matches =
          (await argon2.verify(recoveryCode.codeHash, upperCode).catch(() => false)) ||
          (upperCode !== trimmedCode &&
            (await argon2.verify(recoveryCode.codeHash, trimmedCode).catch(() => false)));
        if (matches) {
          matchedRecoveryCodeId = recoveryCode.id;
          valid = true;
          break;
        }
      }
    }

    if (!valid) {
      const nextAttempts = pending.attempts + 1;
      await this.prisma.mfaChallenge.update({
        where: { id: pending.id },
        data: {
          attempts: nextAttempts,
          ...(nextAttempts >= MAX_MFA_ATTEMPTS ? { consumedAt: new Date() } : {}),
        },
      });
      await this.auditService.record({
        actorId: pending.userId,
        action: 'MFA_FAILED',
        targetType: 'user',
        targetId: pending.userId,
        resource: 'session',
        result: 'DENIED',
        ipAddress: ip,
      });
      throw new UnauthorizedException('Código no válido');
    }

    const sessionToken = randomBytes(32).toString('base64url');
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.mfaChallenge.updateMany({
        where: { id: pending.id, consumedAt: null },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) {
        throw new UnauthorizedException('Sesión de autenticación no válida');
      }

      if (matchedRecoveryCodeId) {
        const usedCode = await tx.recoveryCode.updateMany({
          where: { id: matchedRecoveryCodeId, usedAt: null },
          data: { usedAt: now },
        });
        if (usedCode.count !== 1) {
          throw new UnauthorizedException('Código no válido');
        }
      }

      await tx.session.create({
        data: {
          tokenHash: tokenHash(sessionToken),
          userId: pending.userId,
          expiresAt: new Date(Date.now() + this.maxMs),
          lastSeenAt: now,
        },
      });
    });

    await this.auditService.record({
      actorId: pending.userId,
      action: 'LOGIN_SUCCESS',
      targetType: 'session',
      targetId: pending.userId,
      resource: 'session',
      result: 'ALLOWED',
      ipAddress: ip,
      newValues: { method: matchedRecoveryCodeId ? 'recovery_code' : 'totp' },
    });

    return sessionToken;
  }

  async acceptInvitation(token: string, password: string, ip?: string) {
    this.validatePasswordPolicy(password);
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: { user: true },
    });

    if (
      !invitation ||
      invitation.usedAt ||
      invitation.expiresAt < new Date() ||
      !invitation.user ||
      invitation.user.status !== 'INVITED'
    ) {
      throw new BadRequestException('La invitación no es válida o ha caducado');
    }

    const now = new Date();
    const passwordHash = await argon2.hash(password);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: invitation.userId },
        data: {
          passwordHash,
          status: 'ACTIVE',
          mustChangePassword: false,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { usedAt: now },
      }),
      this.prisma.session.updateMany({
        where: { userId: invitation.userId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);

    await this.auditService.record({
      actorId: invitation.userId,
      action: 'INVITATION_ACCEPTED',
      targetType: 'user',
      targetId: invitation.userId,
      resource: `user:${invitation.userId}`,
      result: 'ALLOWED',
      ipAddress: ip,
    });

    return { ok: true };
  }

  async getUserBySession(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: {
        user: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { module: true },
                },
              },
            },
          },
        },
      },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt < new Date() ||
      session.user.status !== 'ACTIVE'
    ) {
      return null;
    }

    if (Date.now() - session.lastSeenAt.getTime() > this.idleMs) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      return null;
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    });

    return session.user;
  }

  async logout(token: string, actorId?: string | null, ip?: string) {
    await this.prisma.session.updateMany({
      where: { tokenHash: tokenHash(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (actorId) {
      await this.auditService.record({
        actorId,
        action: 'LOGOUT',
        targetType: 'session',
        targetId: actorId,
        resource: 'session',
        result: 'ALLOWED',
        ipAddress: ip,
      });
    }
  }

  async revokeUserSessions(userId: string) {
    const now = new Date();
    const ops: Array<Promise<unknown>> = [
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ];
    if (this.prisma.mfaChallenge?.updateMany) {
      ops.push(
        this.prisma.mfaChallenge.updateMany({
          where: { userId, consumedAt: null },
          data: { consumedAt: now },
        }),
      );
    }
    await Promise.all(ops);
  }

  async revokeRoleSessions(roleId: string) {
    const users = await this.prisma.user.findMany({
      where: { roleId, isSuperAdmin: false },
      select: { id: true },
    });
    if (!users.length) return;
    const userIds = users.map((u) => u.id);
    const now = new Date();

    const ops: Array<Promise<unknown>> = [
      this.prisma.session.updateMany({
        where: { userId: { in: userIds }, revokedAt: null },
        data: { revokedAt: now },
      }),
    ];
    if (this.prisma.mfaChallenge?.updateMany) {
      ops.push(
        this.prisma.mfaChallenge.updateMany({
          where: { userId: { in: userIds }, consumedAt: null },
          data: { consumedAt: now },
        }),
      );
    }
    await Promise.all(ops);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    nextPassword: string,
    ip?: string,
  ) {
    this.validatePasswordPolicy(nextPassword);
    if (currentPassword === nextPassword) {
      throw new BadRequestException('La nueva contraseña debe ser diferente');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'ACTIVE' || !(await argon2.verify(user.passwordHash, currentPassword))) {
      await this.auditService.record({
        actorId: userId,
        action: 'PASSWORD_CHANGED',
        targetType: 'user',
        targetId: userId,
        resource: `user:${userId}`,
        result: 'DENIED',
        ipAddress: ip,
      });
      throw new UnauthorizedException('La contraseña actual no es válida');
    }

    const now = new Date();
    const newHash = await argon2.hash(nextPassword);
    const rotatedToken = randomBytes(32).toString('base64url');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newHash,
          mustChangePassword: false,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      }),
      this.prisma.mfaChallenge.updateMany({
        where: { userId, consumedAt: null },
        data: { consumedAt: now },
      }),
      this.prisma.session.create({
        data: {
          tokenHash: tokenHash(rotatedToken),
          userId,
          expiresAt: new Date(Date.now() + this.maxMs),
          lastSeenAt: now,
        },
      }),
    ]);

    await this.auditService.record({
      actorId: userId,
      action: 'PASSWORD_CHANGED',
      targetType: 'user',
      targetId: userId,
      resource: `user:${userId}`,
      result: 'ALLOWED',
      ipAddress: ip,
    });

    return { ok: true, token: rotatedToken };
  }

  async setInitialPassword(
    userId: string,
    nextPassword: string,
    currentToken: string,
    ip?: string,
  ) {
    this.validatePasswordPolicy(nextPassword);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mustChangePassword || user.status !== 'ACTIVE') {
      throw new BadRequestException('No hay ningún cambio inicial pendiente');
    }
    if (await argon2.verify(user.passwordHash, nextPassword).catch(() => false)) {
      throw new BadRequestException('La nueva contraseña debe ser diferente a la temporal');
    }

    const now = new Date();
    const newHash = await argon2.hash(nextPassword);
    const rotatedToken = randomBytes(32).toString('base64url');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newHash,
          mustChangePassword: false,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      }),
      this.prisma.mfaChallenge.updateMany({
        where: { userId, consumedAt: null },
        data: { consumedAt: now },
      }),
      this.prisma.session.create({
        data: {
          tokenHash: tokenHash(rotatedToken),
          userId,
          expiresAt: new Date(Date.now() + this.maxMs),
          lastSeenAt: now,
        },
      }),
    ]);

    // Ensure currentToken is never usable again even if mocked in isolation
    void currentToken;

    await this.auditService.record({
      actorId: userId,
      action: 'INITIAL_PASSWORD_CHANGED',
      targetType: 'user',
      targetId: userId,
      resource: `user:${userId}`,
      result: 'ALLOWED',
      ipAddress: ip,
    });

    return { ok: true, token: rotatedToken };
  }

  async setupMfa(userId: string, currentPassword?: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Cuenta no válida');
    }

    if (user.mfaConfiguredAt) {
      if (!currentPassword || !(await argon2.verify(user.passwordHash, currentPassword).catch(() => false))) {
        await this.auditService.record({
          actorId: userId,
          action: 'MFA_RECONFIGURE_DENIED',
          targetType: 'user',
          targetId: userId,
          resource: 'mfa',
          result: 'DENIED',
          ipAddress: ip,
        });
        throw new UnauthorizedException(
          'Debes confirmar tu contraseña actual para reconfigurar la verificación en dos pasos',
        );
      }
    }

    const secret = generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaPendingSecret: this.encrypt(secret) },
    });

    return {
      secret,
      otpauthUrl: generateURI({ issuer: 'Grupo Scout', label: user.email, secret }),
    };
  }

  async confirmMfa(userId: string, code: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'ACTIVE' || !user.mfaPendingSecret) {
      throw new BadRequestException('No hay ninguna configuración MFA pendiente');
    }

    if (!verifySync({ token: code.trim(), secret: this.decrypt(user.mfaPendingSecret) }).valid) {
      throw new BadRequestException('Código MFA no válido');
    }

    const codes = Array.from({ length: 10 }, () =>
      randomBytes(5).toString('hex').toUpperCase(),
    );
    const hashedCodes = await Promise.all(
      codes.map(async (value) => ({ userId, codeHash: await argon2.hash(value) })),
    );

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          mfaSecret: user.mfaPendingSecret,
          mfaPendingSecret: null,
          mfaConfiguredAt: new Date(),
        },
      }),
      this.prisma.recoveryCode.deleteMany({ where: { userId } }),
      this.prisma.recoveryCode.createMany({ data: hashedCodes }),
    ]);

    await this.auditService.record({
      actorId: userId,
      action: 'MFA_RECONFIGURED',
      targetType: 'user',
      targetId: userId,
      resource: 'mfa',
      result: 'ALLOWED',
      ipAddress: ip,
    });

    return { ok: true, recoveryCodes: codes };
  }

  async buildMePayload(user: Record<string, any>) {
    const modules = await this.authorization.listRegisteredModules();
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      isSuperAdmin: Boolean(user.isSuperAdmin),
      mustChangePassword: Boolean(user.mustChangePassword),
      mfaConfiguredAt: user.mfaConfiguredAt ?? null,
      roleId: user.roleId ?? null,
      role: user.role ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      modules,
    };
  }

  async audit(actorId: string | null, action: string, resource: string, result: string, ipAddress?: string) {
    await this.auditService.record({
      actorId,
      action,
      resource,
      result: result === 'DENIED' ? 'DENIED' : 'ALLOWED',
      ipAddress,
    });
  }

  private key() {
    const raw = process.env.MFA_ENCRYPTION_KEY;
    if (!raw || Buffer.from(raw, 'base64').length !== 32) {
      throw new Error('MFA_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
    }
    return Buffer.from(raw, 'base64');
  }

  private encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const body = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return `${iv.toString('base64')}.${cipher.getAuthTag().toString('base64')}.${body.toString('base64')}`;
  }

  private decrypt(value: string) {
    const [iv, tag, body] = value.split('.').map((part) => Buffer.from(part, 'base64'));
    const decipher = createDecipheriv('aes-256-gcm', this.key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8');
  }
}
