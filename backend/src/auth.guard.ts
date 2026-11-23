import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService, sessionCookie } from './auth.service';
import { ALLOW_PASSWORD_CHANGE_KEY } from './authorization/authorization.decorators';
import {
  canReadSensitiveData,
  hasModulePermission as checkModulePermission,
  hasWebContentPermission,
  isSuperAdminUser,
  type AuthorizedUser,
  type PermissionAction,
} from './authorization/module-registry';

export type AuthenticatedRequest = Request & { user?: AuthorizedUser & Record<string, any> };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    @Optional() private readonly reflector?: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.[sessionCookie];
    const user = token ? await this.auth.getUserBySession(token) : null;
    if (!user) {
      throw new UnauthorizedException('Sesión no válida o caducada');
    }

    const allowDuringOnboardingMeta = this.reflector?.getAllAndOverride<boolean>(
      ALLOW_PASSWORD_CHANGE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const path = request.path;
    const allowedDuringOnboarding =
      Boolean(allowDuringOnboardingMeta) ||
      path === '/auth/me' ||
      path === '/auth/password' ||
      path === '/auth/password/initial' ||
      path === '/auth/logout' ||
      path.startsWith('/auth/mfa');

    if (user.mustChangePassword && !allowedDuringOnboarding) {
      throw new ForbiddenException('Debes cambiar tu contraseña antes de continuar');
    }

    request.user = user as AuthenticatedRequest['user'];
    return true;
  }
}

export function ensureAdmin(request: AuthenticatedRequest) {
  if (!request.user) throw new UnauthorizedException('Sesión no válida o caducada');
  if (!isSuperAdminUser(request.user)) {
    throw new ForbiddenException('Solo el superadministrador absoluto');
  }
}

type LegacyOrModernAction = PermissionAction | 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete';

function normalizeAction(action: LegacyOrModernAction): PermissionAction {
  switch (action) {
    case 'canRead':
    case 'read':
      return 'read';
    case 'canCreate':
    case 'create':
      return 'create';
    case 'canUpdate':
    case 'update':
      return 'update';
    case 'canDelete':
    case 'delete':
      return 'delete';
    case 'access':
      return 'access';
  }
}

export function hasModulePermission(
  user: AuthenticatedRequest['user'],
  moduleNameOrKey: string,
  action: LegacyOrModernAction,
): boolean {
  return checkModulePermission(user, moduleNameOrKey, normalizeAction(action));
}

export function ensurePermission(
  request: AuthenticatedRequest,
  moduleNameOrKey: string,
  action: LegacyOrModernAction,
) {
  if (!request.user) {
    throw new UnauthorizedException('Sesión no válida o caducada');
  }
  if (!hasModulePermission(request.user, moduleNameOrKey, action)) {
    throw new ForbiddenException('Operación no autorizada');
  }
}

export function canReadSensitiveMedicalOrBankData(
  user: AuthenticatedRequest['user'],
  kind: 'medical' | 'bank',
): boolean {
  return canReadSensitiveData(user, kind);
}

export function ensureWebContentPermission(
  request: AuthenticatedRequest,
  action: LegacyOrModernAction,
) {
  if (!request.user) {
    throw new UnauthorizedException('Sesión no válida o caducada');
  }
  const normalized = normalizeAction(action);
  const crudAction = normalized === 'access' ? 'read' : normalized;
  if (hasWebContentPermission(request.user, crudAction)) {
    return;
  }
  throw new ForbiddenException('Operación no autorizada para gestionar contenido de la web');
}
