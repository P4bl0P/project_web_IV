import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import * as argon2 from 'argon2';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export const sessionCookie = 'scout_session';
const tokenHash = (value: string) => createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  private readonly idleMs = Number(process.env.SESSION_IDLE_MS ?? 900000);
  private readonly maxMs = Number(process.env.SESSION_MAX_MS ?? 28800000);
  constructor(private readonly prisma: PrismaService) {}

  async login(email: string, password: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || user.status !== 'ACTIVE' || !(await argon2.verify(user.passwordHash, password))) {
      await this.audit(null, 'LOGIN_FAILED', email, 'DENIED', ip);
      throw new UnauthorizedException('Credenciales no válidas');
    }
    const challenge = randomBytes(32).toString('base64url');
    let setup: { secret: string; otpauthUrl: string } | undefined;
    if (!user.mfaConfiguredAt || !user.mfaSecret) {
      const secret = generateSecret();
      await this.prisma.user.update({ where: { id: user.id }, data: { mfaSecret: this.encrypt(secret) } });
      setup = { secret, otpauthUrl: generateURI({ issuer: 'Grupo Scout', label: user.email, secret }) };
    }
    await this.prisma.session.create({ data: { tokenHash: tokenHash(challenge), userId: user.id, expiresAt: new Date(Date.now() + 300000) } });
    return { status: user.mfaConfiguredAt && user.mfaSecret ? 'MFA_REQUIRED' : 'MFA_SETUP_REQUIRED', challenge, setup };
  }

  async confirmMfaChallenge(challenge: string, code: string) {
    const pending = await this.prisma.session.findUnique({ where: { tokenHash: tokenHash(challenge) }, include: { user: true } });
    if (!pending || pending.expiresAt < new Date() || !pending.user.mfaSecret) throw new UnauthorizedException('Sesión de autenticación no válida');
    if (!verifySync({ token: code, secret: this.decrypt(pending.user.mfaSecret) }).valid) throw new BadRequestException('Código MFA no válido');
    await this.prisma.user.update({ where: { id: pending.userId }, data: { mfaConfiguredAt: new Date(), status: 'ACTIVE' } });
    const token = await this.completeMfa(challenge, code);
    const codes = Array.from({ length: 10 }, () => randomBytes(5).toString('hex').toUpperCase());
    await this.prisma.recoveryCode.deleteMany({ where: { userId: pending.userId } });
    await this.prisma.recoveryCode.createMany({ data: await Promise.all(codes.map(async (value) => ({ userId: pending.userId, codeHash: await argon2.hash(value) }))) });
    return { token, codes };
  }

  async acceptInvitation(token: string, password: string) {
    if (password.length < 15) throw new BadRequestException('La contraseña debe tener al menos 15 caracteres');
    const invitation = await this.prisma.invitation.findUnique({ where: { tokenHash: tokenHash(token) } });
    if (!invitation || invitation.usedAt || invitation.expiresAt < new Date()) throw new BadRequestException('La invitación no es válida o ha caducado');
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: invitation.userId }, data: { passwordHash: await argon2.hash(password), status: 'ACTIVE', mustChangePassword: false } }),
      this.prisma.invitation.update({ where: { id: invitation.id }, data: { usedAt: new Date() } }),
    ]);
    return { ok: true };
  }

  async completeMfa(challenge: string, code: string, ip?: string) {
    const pending = await this.prisma.session.findUnique({ where: { tokenHash: tokenHash(challenge) }, include: { user: true } });
    if (!pending || pending.expiresAt < new Date() || pending.user.status !== 'ACTIVE' || !pending.user.mfaSecret) throw new UnauthorizedException('Sesión de autenticación no válida');
    let valid = verifySync({ token: code, secret: this.decrypt(pending.user.mfaSecret) }).valid;
    if (!valid) {
      const recoveryCodes = await this.prisma.recoveryCode.findMany({ where: { userId: pending.userId, usedAt: null } });
      for (const recoveryCode of recoveryCodes) {
        if (await argon2.verify(recoveryCode.codeHash, code)) {
          await this.prisma.recoveryCode.update({ where: { id: recoveryCode.id }, data: { usedAt: new Date() } });
          valid = true;
          break;
        }
      }
    }
    if (!valid) {
      await this.audit(pending.userId, 'MFA_FAILED', 'session', 'DENIED', ip);
      throw new UnauthorizedException('Código no válido');
    }
    const token = randomBytes(32).toString('base64url');
    await this.prisma.$transaction([
      this.prisma.session.update({ where: { id: pending.id }, data: { tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + this.maxMs), lastSeenAt: new Date() } }),
      this.prisma.auditEvent.create({ data: { actorId: pending.userId, action: 'LOGIN_SUCCESS', resource: 'session', result: 'ALLOWED', ipAddress: ip } }),
    ]);
    return token;
  }

  async getUserBySession(token: string) {
    const session = await this.prisma.session.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: { include: { role: { include: { permissions: { include: { module: true } } } } } } } });
    if (!session || session.revokedAt || session.expiresAt < new Date() || session.user.status !== 'ACTIVE') return null;
    if (Date.now() - session.lastSeenAt.getTime() > this.idleMs) { await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } }); return null; }
    await this.prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
    return session.user;
  }

  async logout(token: string) { await this.prisma.session.updateMany({ where: { tokenHash: tokenHash(token) }, data: { revokedAt: new Date() } }); }

  async changePassword(userId: string, currentPassword: string, nextPassword: string, ip?: string) {
    if (nextPassword.length < 15) throw new BadRequestException('La contraseña debe tener al menos 15 caracteres');
    if (currentPassword === nextPassword) throw new BadRequestException('La nueva contraseña debe ser diferente');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await argon2.verify(user.passwordHash, currentPassword))) {
      await this.audit(userId, 'PASSWORD_CHANGED', userId, 'DENIED', ip);
      throw new UnauthorizedException('La contraseña actual no es válida');
    }
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await argon2.hash(nextPassword), mustChangePassword: false } }),
      this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
      this.prisma.auditEvent.create({ data: { actorId: userId, action: 'PASSWORD_CHANGED', resource: userId, result: 'ALLOWED', ipAddress: ip } }),
    ]);
    return { ok: true };
  }

  async setupMfa(userId: string) {
    const secret = generateSecret();
    const user = await this.prisma.user.update({ where: { id: userId }, data: { mfaSecret: this.encrypt(secret) } });
    return { secret, otpauthUrl: generateURI({ issuer: 'Grupo Scout', label: user.email, secret }) };
  }

  async confirmMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret || !verifySync({ token: code, secret: this.decrypt(user.mfaSecret) }).valid) throw new BadRequestException('Código MFA no válido');
    await this.prisma.user.update({ where: { id: userId }, data: { mfaConfiguredAt: new Date(), status: 'ACTIVE' } });
    return { ok: true };
  }

  async audit(actorId: string | null, action: string, resource: string, result: string, ipAddress?: string) {
    await this.prisma.auditEvent.create({ data: { actorId, action, resource, result, ipAddress } });
  }

  private key() {
    const raw = process.env.MFA_ENCRYPTION_KEY;
    if (!raw || Buffer.from(raw, 'base64').length !== 32) throw new Error('MFA_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
    return Buffer.from(raw, 'base64');
  }
  private encrypt(value: string) {
    const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const body = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return `${iv.toString('base64')}.${cipher.getAuthTag().toString('base64')}.${body.toString('base64')}`;
  }
  private decrypt(value: string) {
    const [iv, tag, body] = value.split('.').map((part) => Buffer.from(part, 'base64'));
    const decipher = createDecipheriv('aes-256-gcm', this.key(), iv); decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8');
  }
}
