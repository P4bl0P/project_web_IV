import { SetMetadata } from '@nestjs/common';
import type { PermissionAction } from './module-registry';

export const REQUIRE_SUPER_ADMIN_KEY = 'auth:require_super_admin';
export const REQUIRE_PERMISSION_KEY = 'auth:require_permission';
export const ALLOW_PASSWORD_CHANGE_KEY = 'auth:allow_password_change';

export interface PermissionRequirement {
  moduleKey: string;
  action: PermissionAction;
  specialAction?: string;
}

export const RequireSuperAdmin = () => SetMetadata(REQUIRE_SUPER_ADMIN_KEY, true);

export const RequirePermission = (
  moduleKey: string,
  action: PermissionAction,
  specialAction?: string,
) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, {
    moduleKey,
    action,
    specialAction,
  } satisfies PermissionRequirement);

export const AllowDuringPasswordChange = () => SetMetadata(ALLOW_PASSWORD_CHANGE_KEY, true);
