import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { AuthGuard, ensureAdmin } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { AuthService } from './auth.service';
import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import { Prisma } from '@prisma/client';

const temporaryPassword = () => randomBytes(18).toString('base64url');

@Controller('admin')
@UseGuards(AuthGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService, private readonly auth: AuthService) {}

  @Get('users')
  async users(@Req() req: AuthenticatedRequest) {
    ensureAdmin(req);
    return this.prisma.user.findMany({
      where: { isSuperAdmin: false },
      select: { id: true, email: true, name: true, status: true, role: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('users')
  async createUser(@Req() req: AuthenticatedRequest, @Body() body: { email?: string; name?: string; roleId?: string }) {
    ensureAdmin(req);
    const email = body.email?.trim().toLowerCase();
    const name = body.name?.trim();
    if (!email || !name || !body.roleId || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new BadRequestException('Nombre, correo y cargo son obligatorios');
    }
    if (!(await this.prisma.role.findUnique({ where: { id: body.roleId } }))) {
      throw new BadRequestException('El cargo seleccionado no existe');
    }
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException('El correo ya está registrado');
    const password = temporaryPassword();
    const user = await this.prisma.user.create({
      data: { email, name, roleId: body.roleId, passwordHash: await argon2.hash(password), status: 'ACTIVE', mustChangePassword: true },
      select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
    });
    await this.auth.audit(req.user!.id, 'USER_CREATED', user.id, 'ALLOWED', req.ip);
    return { user, temporaryPassword: password };
  }

  @Patch('users/:id')
  async updateUser(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string; roleId?: string; status?: 'ACTIVE' | 'BLOCKED' | 'DISABLED' },
  ) {
    ensureAdmin(req);
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.isSuperAdmin) throw new BadRequestException('La cuenta no se puede modificar desde este panel');
    const email = body.email?.trim().toLowerCase();
    if (email && email !== target.email && (await this.prisma.user.findUnique({ where: { email } }))) {
      throw new ConflictException('El correo ya está registrado');
    }
    if (body.roleId && !(await this.prisma.role.findUnique({ where: { id: body.roleId } }))) {
      throw new BadRequestException('El cargo seleccionado no existe');
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(body.name?.trim() ? { name: body.name.trim() } : {}),
        ...(email ? { email } : {}),
        ...(body.roleId ? { roleId: body.roleId } : {}),
        ...(body.status ? { status: body.status } : {}),
      },
      select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
    });
    await this.auth.audit(req.user!.id, 'USER_UPDATED', id, 'ALLOWED', req.ip);
    return user;
  }

  @Post('users/:id/reset-password')
  async resetPassword(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    ensureAdmin(req);
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.isSuperAdmin) throw new BadRequestException('La cuenta no se puede restablecer desde este panel');
    const password = temporaryPassword();
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { passwordHash: await argon2.hash(password), mustChangePassword: true } }),
      this.prisma.session.updateMany({ where: { userId: id }, data: { revokedAt: new Date() } }),
    ]);
    await this.auth.audit(req.user!.id, 'PASSWORD_RESET', id, 'ALLOWED', req.ip);
    return { temporaryPassword: password };
  }

  @Delete('users/:id')
  async disableUser(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    ensureAdmin(req);
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target || target.isSuperAdmin) throw new BadRequestException('La cuenta no se puede desactivar');
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { status: 'DISABLED' } }),
      this.prisma.session.updateMany({ where: { userId: id }, data: { revokedAt: new Date() } }),
    ]);
    await this.auth.audit(req.user!.id, 'USER_DISABLED', id, 'ALLOWED', req.ip);
    return { ok: true };
  }

  @Get('roles')
  async roles(@Req() req: AuthenticatedRequest) {
    ensureAdmin(req);
    return this.prisma.role.findMany({
      include: { _count: { select: { users: { where: { isSuperAdmin: false } } } }, permissions: { include: { module: true } } },
      orderBy: { name: 'asc' },
    });
  }

  @Post('roles')
  async createRole(@Req() req: AuthenticatedRequest, @Body() body: { name?: string }) {
    ensureAdmin(req);
    const name = body.name?.trim();
    if (!name) throw new BadRequestException('El nombre del cargo es obligatorio');
    try {
      const role = await this.prisma.role.create({ data: { name } });
      await this.auth.audit(req.user!.id, 'ROLE_CREATED', role.id, 'ALLOWED', req.ip);
      return role;
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe un cargo con ese nombre');
      }
      throw error;
    }
  }

  @Patch('roles/:id')
  async updateRole(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: { name?: string }) {
    ensureAdmin(req);
    if (!body.name?.trim()) throw new BadRequestException('El nombre del cargo es obligatorio');
    const role = await this.prisma.role.update({ where: { id }, data: { name: body.name.trim() } });
    await this.auth.audit(req.user!.id, 'ROLE_UPDATED', id, 'ALLOWED', req.ip);
    return role;
  }

  @Get('modules')
  async modules(@Req() req: AuthenticatedRequest) { ensureAdmin(req); return this.prisma.module.findMany({ orderBy: { name: 'asc' } }); }

  @Post('modules')
  async createModule(@Req() req: AuthenticatedRequest, @Body() body: { name?: string }) {
    ensureAdmin(req);
    const name = body.name?.trim();
    if (!name) throw new BadRequestException('El nombre del módulo es obligatorio');
    const module = await this.prisma.module.create({ data: { name } });
    const roles = await this.prisma.role.findMany({ select: { id: true } });
    if (roles.length) await this.prisma.permission.createMany({ data: roles.map((role) => ({ roleId: role.id, moduleId: module.id })) });
    return module;
  }

  @Get('permissions')
  async permissions(@Req() req: AuthenticatedRequest) { ensureAdmin(req); return this.prisma.permission.findMany({ include: { role: true, module: true } }); }

  @Patch('permissions/:id')
  async updatePermission(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: { canRead?: boolean; canCreate?: boolean; canUpdate?: boolean; canDelete?: boolean }) {
    ensureAdmin(req);
    const data = Object.fromEntries(Object.entries(body).filter(([key, value]) => ['canRead', 'canCreate', 'canUpdate', 'canDelete'].includes(key) && typeof value === 'boolean'));
    const result = await this.prisma.permission.update({ where: { id }, data });
    await this.auth.audit(req.user!.id, 'PERMISSION_CHANGED', id, 'ALLOWED', req.ip);
    return result;
  }

  @Get('audit')
  async audit(@Req() req: AuthenticatedRequest) { ensureAdmin(req); return this.prisma.auditEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }); }
}
