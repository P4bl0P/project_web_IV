export type PermissionAction = 'access' | 'read' | 'create' | 'update' | 'delete';

export interface SpecialActionDefinition {
  key: string;
  label: string;
  description: string;
}

export interface ModuleDefinition {
  key: string;
  name: string;
  description: string;
  route: string;
  icon: string;
  isImplemented: boolean;
  isSystem: boolean;
  displayOrder: number;
  supportsRead: boolean;
  supportsCreate: boolean;
  supportsUpdate: boolean;
  supportsDelete: boolean;
  specialActions: SpecialActionDefinition[];
}

export interface InitialRoleDefinition {
  name: string;
  description: string;
  defaultModuleKey: string;
}

export interface UserModulePermission {
  id?: string;
  canAccess?: boolean;
  canRead?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  specialPermissions?: unknown;
  module?: {
    id?: string;
    key?: string | null;
    name?: string | null;
  } | null;
}

export interface AuthorizedUser {
  id?: string;
  status?: string | null;
  isSuperAdmin?: boolean;
  mustChangePassword?: boolean;
  role?: {
    id?: string;
    name?: string | null;
    permissions?: UserModulePermission[] | null;
  } | null;
}

export const BUILT_IN_MODULES: readonly ModuleDefinition[] = [
  {
    key: 'jefatura',
    name: 'Jefatura',
    description: 'Coordinación de ramas, Kraal de responsables y programación de la Ronda Solar.',
    route: '/gestion/jefatura',
    icon: 'compass',
    isImplemented: false,
    isSystem: true,
    displayOrder: 1,
    supportsRead: true,
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    specialActions: [],
  },
  {
    key: 'secretaria',
    name: 'Secretaría',
    description:
      'Gestión de solicitudes, lista de espera, inscripciones, censo oficial y contenido público del Consejo.',
    route: '/gestion/secretaria',
    icon: 'folder-kanban',
    isImplemented: true,
    isSystem: true,
    displayOrder: 2,
    supportsRead: true,
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    specialActions: [],
  },
  {
    key: 'tesoreria',
    name: 'Tesorería',
    description: 'Remesas bancarias SEPA, cuotas trimestrales y presupuestos de campamentos.',
    route: '/gestion/tesoreria',
    icon: 'wallet',
    isImplemented: false,
    isSystem: true,
    displayOrder: 3,
    supportsRead: true,
    supportsCreate: true,
    supportsUpdate: true,
    supportsDelete: true,
    specialActions: [],
  },
];

export const INITIAL_ROLES: readonly InitialRoleDefinition[] = [
  {
    name: 'Jefatura',
    description: 'Coordinación de grupo, programación de Ronda Solar y Kraal.',
    defaultModuleKey: 'jefatura',
  },
  {
    name: 'Tesorería',
    description: 'Gestión económica, cuotas, remesas y presupuestos del grupo.',
    defaultModuleKey: 'tesoreria',
  },
  {
    name: 'Secretaría',
    description: 'Gestión administrativa de solicitudes, inscripciones, censo y comunicación.',
    defaultModuleKey: 'secretaria',
  },
];

const RESERVED_ROLE_SLUGS = new Set([
  'superadmin',
  'superadministrador',
  'superadministradora',
  'super-admin',
  'super-administrador',
  'administrador-absoluto',
  'admin-absoluto',
]);

export function normalizeText(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function slugifyModuleKey(value?: string | null): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isReservedRoleName(name?: string | null): boolean {
  const slug = slugifyModuleKey(name);
  const compact = slug.replace(/-/g, '');
  return RESERVED_ROLE_SLUGS.has(slug) || RESERVED_ROLE_SLUGS.has(compact);
}

export function isSuperAdminUser(user?: AuthorizedUser | null): boolean {
  if (!user || user.isSuperAdmin !== true) return false;
  if (user.status && user.status !== 'ACTIVE') return false;
  return true;
}

export function parseSpecialPermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

export function findModulePermission(
  user: AuthorizedUser | null | undefined,
  moduleKey: string,
): UserModulePermission | undefined {
  if (!user || !user.role?.permissions?.length) return undefined;
  const target = slugifyModuleKey(moduleKey);
  if (!target) return undefined;
  return user.role.permissions.find((item) => {
    const candidate = item.module?.key
      ? slugifyModuleKey(item.module.key)
      : slugifyModuleKey(item.module?.name);
    return candidate === target;
  });
}

export function hasModuleAccess(user: AuthorizedUser | null | undefined, moduleKey: string): boolean {
  if (!user) return false;
  if (user.status && user.status !== 'ACTIVE') return false;
  if (isSuperAdminUser(user)) return true;
  const permission = findModulePermission(user, moduleKey);
  if (!permission || permission.canAccess === false) return false;
  return Boolean(
    permission.canAccess ||
      permission.canRead ||
      permission.canCreate ||
      permission.canUpdate ||
      permission.canDelete,
  );
}

export function hasModulePermission(
  user: AuthorizedUser | null | undefined,
  moduleKey: string,
  action: PermissionAction,
): boolean {
  if (!user) return false;
  if (user.status && user.status !== 'ACTIVE') return false;
  if (isSuperAdminUser(user)) return true;

  const permission = findModulePermission(user, moduleKey);
  if (!permission || permission.canAccess === false) return false;

  switch (action) {
    case 'access':
      return hasModuleAccess(user, moduleKey);
    case 'read':
      return permission.canRead === true;
    case 'create':
      return permission.canCreate === true;
    case 'update':
      return permission.canUpdate === true;
    case 'delete':
      return permission.canDelete === true;
    default:
      return false;
  }
}

export function canReadSensitiveData(
  user: AuthorizedUser | null | undefined,
  _kind: 'medical' | 'bank',
): boolean {
  if (isSuperAdminUser(user)) return true;
  return hasModulePermission(user, 'secretaria', 'update');
}

export function hasWebContentPermission(
  user: AuthorizedUser | null | undefined,
  action: 'read' | 'create' | 'update' | 'delete',
): boolean {
  if (isSuperAdminUser(user)) return true;
  return hasModulePermission(user, 'secretaria', action);
}

const SAFE_AUDIT_KEYS = new Set([
  'hasChildDni',
  'ibanLast4',
  'mfaConfiguredAt',
  'mustChangePassword',
  'supportsRead',
  'supportsCreate',
  'supportsUpdate',
  'supportsDelete',
]);

const SENSITIVE_AUDIT_PATTERN =
  /password|secret|token|signature|recovery|codehash|iban|dni/i;

export function sanitizeAuditValue(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (value instanceof Date) return value.toISOString();
  if (depth > 6 || typeof value !== 'object') return '[TRUNCATED]';

  if (seen.has(value)) return '[CIRCULAR]';
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditValue(item, depth + 1, seen));
  }

  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!SAFE_AUDIT_KEYS.has(key) && SENSITIVE_AUDIT_PATTERN.test(key)) {
      out[key] = '[REDACTED]';
    } else {
      out[key] = sanitizeAuditValue(entry, depth + 1, seen);
    }
  }
  return out;
}
