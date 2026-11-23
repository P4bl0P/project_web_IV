/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AccessDeniedView from './components/shared/AccessDeniedView';
import type { RegisteredModule, SpecialActionDefinition } from './services/api';

export type { RegisteredModule, SpecialActionDefinition };

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

export type PermissionAction =
  | 'canAccess'
  | 'canRead'
  | 'canCreate'
  | 'canUpdate'
  | 'canDelete'
  | 'access'
  | 'read'
  | 'create'
  | 'update'
  | 'delete';

export type UserPermission = {
  id?: string;
  canAccess: boolean;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  specialPermissions?: string[];
  module?: {
    id?: string;
    key?: string | null;
    name: string;
    route?: string | null;
  };
};

export type User = {
  id: string;
  email: string;
  name: string;
  status?: string;
  isSuperAdmin: boolean;
  mustChangePassword?: boolean;
  mfaConfiguredAt?: string | null;
  roleId?: string | null;
  role?: {
    id?: string;
    name: string;
    description?: string | null;
    permissions?: UserPermission[];
  } | null;
  modules?: RegisteredModule[];
};

export const DEFAULT_REGISTERED_MODULES: RegisteredModule[] = [
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
    specialActions: [
      { key: 'read_medical_data', label: 'Datos médicos' },
      { key: 'read_bank_data', label: 'Datos bancarios (SEPA)' },
      { key: 'preview_aurora', label: 'Vista previa Aurora' },
      { key: 'manage_web_content', label: 'Contenido de la web' },
    ],
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
    specialActions: [{ key: 'export_sepa', label: 'Exportar remesas SEPA' }],
  },
];

function slugifyModuleKey(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isSuperAdmin(user: User | null | undefined): boolean {
  if (!user || user.isSuperAdmin !== true) return false;
  if (user.status && user.status !== 'ACTIVE') return false;
  return true;
}

function findUserModulePermission(
  user: User | null | undefined,
  moduleKeyOrName: string,
): UserPermission | undefined {
  if (!user || !user.role?.permissions?.length) return undefined;
  const target = slugifyModuleKey(moduleKeyOrName);
  if (!target) return undefined;
  return user.role.permissions.find((permission) => {
    const candidate = permission.module?.key
      ? slugifyModuleKey(permission.module.key)
      : slugifyModuleKey(permission.module?.name);
    return candidate === target;
  });
}

function normalizeAction(
  action: PermissionAction,
): 'canAccess' | 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete' {
  switch (action) {
    case 'access':
    case 'canAccess':
      return 'canAccess';
    case 'read':
    case 'canRead':
      return 'canRead';
    case 'create':
    case 'canCreate':
      return 'canCreate';
    case 'update':
    case 'canUpdate':
      return 'canUpdate';
    case 'delete':
    case 'canDelete':
      return 'canDelete';
  }
}

export function hasModuleAccess(
  user: User | null | undefined,
  moduleKeyOrName: string,
): boolean {
  if (!user) return false;
  if (user.status && user.status !== 'ACTIVE') return false;
  if (isSuperAdmin(user)) return true;
  const permission = findUserModulePermission(user, moduleKeyOrName);
  return permission?.canAccess === true;
}

export function hasModulePermission(
  user: User | null | undefined,
  moduleKeyOrName: string,
  action: PermissionAction = 'canRead',
): boolean {
  if (!user) return false;
  if (user.status && user.status !== 'ACTIVE') return false;
  if (isSuperAdmin(user)) return true;

  const permission = findUserModulePermission(user, moduleKeyOrName);
  if (permission?.canAccess !== true) return false;

  const normalized = normalizeAction(action);
  return Boolean(permission[normalized]);
}

export function hasSpecialPermission(
  user: User | null | undefined,
  moduleKeyOrName: string,
  specialKey: string,
): boolean {
  if (!user) return false;
  if (user.status && user.status !== 'ACTIVE') return false;
  if (isSuperAdmin(user)) return true;

  const permission = findUserModulePermission(user, moduleKeyOrName);
  if (permission?.canAccess !== true) return false;

  return (
    Array.isArray(permission.specialPermissions) &&
    permission.specialPermissions.includes(specialKey)
  );
}

export function getModuleCapabilities(user: User | null | undefined, moduleKeyOrName: string) {
  return {
    canAccess: hasModuleAccess(user, moduleKeyOrName),
    canRead: hasModulePermission(user, moduleKeyOrName, 'canRead'),
    canCreate: hasModulePermission(user, moduleKeyOrName, 'canCreate'),
    canUpdate: hasModulePermission(user, moduleKeyOrName, 'canUpdate'),
    canDelete: hasModulePermission(user, moduleKeyOrName, 'canDelete'),
    hasSpecial: (specialKey: string) => hasSpecialPermission(user, moduleKeyOrName, specialKey),
  };
}

export function canAccessWebContent(
  user: User | null | undefined,
  action: 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete' = 'canRead',
): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return (
    hasModulePermission(user, 'secretaria', action) &&
    hasSpecialPermission(user, 'secretaria', 'manage_web_content')
  );
}

export function getRegisteredModules(user: User | null | undefined): RegisteredModule[] {
  const source = user?.modules?.length ? user.modules : DEFAULT_REGISTERED_MODULES;
  return [...source].sort((a, b) => {
    const orderDiff = (a.displayOrder ?? 99) - (b.displayOrder ?? 99);
    return orderDiff !== 0 ? orderDiff : a.name.localeCompare(b.name, 'es');
  });
}

export function getAccessibleModules(user: User | null | undefined): RegisteredModule[] {
  return getRegisteredModules(user).filter((mod) => hasModuleAccess(user, mod.key));
}

export type LoginResponse = {
  status: 'MFA_REQUIRED' | 'MFA_SETUP_REQUIRED';
  challenge: string;
  setup?: { secret: string; otpauthUrl: string };
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  completeMfa: (challenge: string, code: string, setup: boolean) => Promise<string[]>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function request(path: string, options: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Inténtalo de nuevo.');
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = Array.isArray(data.message) ? data.message.join(' · ') : data.message;
    throw new Error(typeof message === 'string' ? message : 'No se pudo completar la operación');
  }
  return response.json();
}

export function AuthProvider({
  children,
  initialUser = null,
  skipInitialFetch = false,
}: {
  children: ReactNode;
  initialUser?: User | null;
  skipInitialFetch?: boolean;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!skipInitialFetch);

  useEffect(() => {
    if (skipInitialFetch) return;
    let cancelled = false;
    request('/auth/me')
      .then((nextUser) => {
        if (!cancelled) setUser(nextUser);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [skipInitialFetch]);

  useEffect(() => {
    if (skipInitialFetch || !user?.id) return;
    let cancelled = false;
    const syncSession = async () => {
      try {
        const nextUser = await request('/auth/me');
        if (!cancelled) setUser(nextUser);
      } catch {
        if (!cancelled) setUser(null);
      }
    };

    const interval = window.setInterval(() => {
      void syncSession();
    }, 60_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [skipInitialFetch, user?.id]);

  const refreshUser = async () => {
    setUser(await request('/auth/me'));
  };

  const login = (email: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });

  const completeMfa = async (challenge: string, code: string, setup: boolean) => {
    const result = await request(setup ? '/auth/mfa/confirm-setup' : '/auth/mfa', {
      method: 'POST',
      body: JSON.stringify({ challenge, code: code.trim() }),
    });
    setUser(await request('/auth/me'));
    return result.recoveryCodes ?? [];
  };

  const logout = async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, completeMfa, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

export function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="state-card">Comprobando sesión…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.mustChangePassword && location.pathname !== '/perfil') {
    return <Navigate to="/perfil" replace />;
  }
  return children;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="state-card">Comprobando permisos…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.mustChangePassword) return <Navigate to="/perfil" replace />;
  return isSuperAdmin(user) ? (
    children
  ) : (
    <AccessDeniedView moduleName="Administración" isAdminOnly />
  );
}

export function ModuleRoute({
  moduleKey,
  moduleLabel,
  action = 'canRead',
  specialAction,
  children,
}: {
  moduleKey: string;
  moduleLabel?: string;
  action?: PermissionAction;
  specialAction?: string;
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="state-card">Comprobando permisos…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.mustChangePassword) return <Navigate to="/perfil" replace />;

  const allowed =
    hasModulePermission(user, moduleKey, action) &&
    (!specialAction || hasSpecialPermission(user, moduleKey, specialAction));

  if (!allowed) {
    return <AccessDeniedView moduleName={moduleLabel ?? moduleKey} />;
  }
  return children;
}

export function WebContentRoute({ children }: { children: ReactNode }) {
  return (
    <ModuleRoute
      moduleKey="secretaria"
      moduleLabel="Contenido de la web"
      action="canRead"
      specialAction="manage_web_content"
    >
      {children}
    </ModuleRoute>
  );
}
