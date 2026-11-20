import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';

export type AuthenticatedRequest = Request & { user?: any };
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.cookies?.scout_session ? await this.auth.getUserBySession(request.cookies.scout_session) : null;
    if (!user) throw new UnauthorizedException('Sesión no válida o caducada');
    const path = request.path;
    const allowedDuringOnboarding =
      path === '/auth/me' ||
      path === '/auth/password' ||
      path === '/auth/password/initial' ||
      path === '/auth/logout' ||
      path.startsWith('/auth/mfa');
    if (user.mustChangePassword && !allowedDuringOnboarding) {
      throw new ForbiddenException('Debes cambiar tu contraseña antes de continuar');
    }
    request.user = user; return true;
  }
}
export function ensureAdmin(request: AuthenticatedRequest) {
  if (!request.user?.isSuperAdmin) throw new ForbiddenException('Solo el administrador absoluto');
}
export function ensurePermission(request: AuthenticatedRequest, moduleName: string, action: 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete') {
  if (request.user?.isSuperAdmin) return;
  const permission = request.user?.role?.permissions?.find((item: any) => item.module.name === moduleName);
  if (!permission?.[action]) throw new ForbiddenException('Operación no autorizada');
}

function normalizeRoleName(name?: string | null): string {
  return (name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function ensureWebContentPermission(
  request: AuthenticatedRequest,
  action: 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete',
) {
  if (!request.user) {
    throw new UnauthorizedException('Sesión no válida o caducada');
  }
  if (request.user.isSuperAdmin) return;

  if (normalizeRoleName(request.user.role?.name) === 'secretaria') {
    return;
  }

  const permission = request.user.role?.permissions?.find(
    (item: any) => normalizeRoleName(item.module?.name) === 'secretaria',
  );
  if (permission?.[action]) return;

  throw new ForbiddenException(
    'Operación no autorizada: acceso exclusivo para Secretaría y superadministradores',
  );
}
