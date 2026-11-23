import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedRequest } from '../auth.guard';
import {
  REQUIRE_PERMISSION_KEY,
  REQUIRE_SUPER_ADMIN_KEY,
  type PermissionRequirement,
} from './authorization.decorators';
import { AuthorizationService } from './authorization.service';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorization: AuthorizationService,
    private readonly audit: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireSuperAdmin = this.reflector.getAllAndOverride<boolean>(REQUIRE_SUPER_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requirement = this.reflector.getAllAndOverride<PermissionRequirement | undefined>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireSuperAdmin && !requirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new UnauthorizedException('Sesión no válida o caducada');
    }

    try {
      if (requireSuperAdmin) {
        this.authorization.assertSuperAdmin(request.user);
      }
      if (requirement) {
        this.authorization.assertPermission(request.user, requirement);
      }
      return true;
    } catch (error: unknown) {
      if (error instanceof ForbiddenException) {
        await this.audit.record({
          actorId: request.user.id ?? null,
          action: 'ACCESS_DENIED',
          targetType: requireSuperAdmin ? 'admin' : 'module',
          targetId: requireSuperAdmin ? 'admin' : requirement?.moduleKey ?? null,
          resource: request.originalUrl ?? request.path,
          result: 'DENIED',
          ipAddress: request.ip,
          newValues: {
            method: request.method,
            path: request.path,
            requiredAction: requirement?.action ?? 'superadmin',
            requiredSpecial: requirement?.specialAction ?? null,
          },
        });
      }
      throw error;
    }
  }
}
