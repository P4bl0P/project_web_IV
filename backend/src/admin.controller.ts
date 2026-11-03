import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuthGuard, ensureAdmin } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { AuthService } from './auth.service';
import { createHash, randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';

@Controller('admin')
@UseGuards(AuthGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService, private readonly auth: AuthService) {}
  @Get('users')
  users(@Req() req: AuthenticatedRequest) { ensureAdmin(req); return this.prisma.user.findMany({ select: { id: true, email: true, name: true, status: true, isSuperAdmin: true, role: true, createdAt: true } }); }
  @Get('permissions')
  permissions(@Req() req: AuthenticatedRequest) { ensureAdmin(req); return this.prisma.permission.findMany({ include: { role: true, module: true } }); }
  @Patch('permissions/:id')
  async updatePermission(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: { canRead?: boolean; canCreate?: boolean; canUpdate?: boolean; canDelete?: boolean }) {
    ensureAdmin(req); const result = await this.prisma.permission.update({ where: { id }, data: body });
    await this.auth.audit(req.user.id, 'PERMISSION_CHANGED', id, 'ALLOWED', req.ip); return result;
  }
  @Post('users')
  async createUser(@Req() req: AuthenticatedRequest, @Body() body: { email?: string; name?: string; roleId?: string }) {
    ensureAdmin(req); if (!body.email || !body.name || !body.roleId) throw new Error('Datos incompletos');
    const user = await this.prisma.user.create({ data: { email: body.email.toLowerCase(), name: body.name, roleId: body.roleId, passwordHash: await argon2.hash(randomBytes(32).toString('base64url')) } });
    const token = randomBytes(32).toString('base64url');
    await this.prisma.invitation.create({ data: { email: user.email, userId: user.id, tokenHash: createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now() + 86400000) } });
    await this.auth.audit(req.user.id, 'USER_CREATED', user.id, 'ALLOWED', req.ip); return { id: user.id, invitationToken: token, expiresInHours: 24 };
  }
  @Get('audit')
  audit(@Req() req: AuthenticatedRequest) { ensureAdmin(req); return this.prisma.auditEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }); }
}
