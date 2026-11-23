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
  if (!request.user) throw new UnauthorizedException('Sesión no válida o caducada');
  if (!request.user?.isSuperAdmin) throw new ForbiddenException('Solo el administrador absoluto');
}

function normalizeName(name?: string | null): string {
  return (name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function hasModulePermission(
  user: AuthenticatedRequest['user'],
  moduleName: string,
  action: 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete',
): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  const target = normalizeName(moduleName);
  const permission = user.role?.permissions?.find(
    (item: any) => normalizeName(item.module?.name) === target,
  );
  return Boolean(permission?.[action]);
}

export function ensurePermission(
  request: AuthenticatedRequest,
  moduleName: string,
  action: 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete',
) {
  if (!request.user) {
    throw new UnauthorizedException('Sesión no válida o caducada');
  }
  if (!hasModulePermission(request.user, moduleName, action)) {
    throw new ForbiddenException('Operación no autorizada');
  }
}

export function canReadSensitiveMedicalOrBankData(
  user: AuthenticatedRequest['user'],
  kind: 'medical' | 'bank',
): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (!hasModulePermission(user, 'Secretaría', 'canRead')) return false;

  const subModule =
    kind === 'medical' ? 'Secretaría - Datos Médicos' : 'Secretaría - Datos Bancarios';
  if (hasModulePermission(user, subModule, 'canRead')) {
    return true;
  }

  // Principio de mínimo privilegio: usuarios con rol Secretaría o permiso de actualización
  // en Secretaría acceden a la ficha completa; lectores externos solo al listado/identificación general.
  return (
    normalizeName(user.role?.name) === 'secretaria' ||
    hasModulePermission(user, 'Secretaría', 'canUpdate')
  );
}

export function ensureWebContentPermission(
  request: AuthenticatedRequest,
  action: 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete',
) {
  if (!request.user) {
    throw new UnauthorizedException('Sesión no válida o caducada');
  }
  if (request.user.isSuperAdmin) return;

  if (normalizeName(request.user.role?.name) === 'secretaria') {
    return;
  }

  const permission = request.user.role?.permissions?.find(
    (item: any) => normalizeName(item.module?.name) === 'secretaria',
  );
  if (permission?.[action]) return;

  throw new ForbiddenException(
    'Operación no autorizada: acceso exclusivo para Secretaría y superadministradores',
  );
}
