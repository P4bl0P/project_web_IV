/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

export type UserPermission = {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  module?: { name: string };
};

export type User = {
  id: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
  mustChangePassword?: boolean;
  role?: { id?: string; name: string; permissions?: UserPermission[] } | null;
};

function normalizeRoleLabel(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function canAccessWebContent(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (normalizeRoleLabel(user.role?.name) === 'secretaria') return true;
  return Boolean(
    user.role?.permissions?.some(
      (permission) =>
        normalizeRoleLabel(permission.module?.name) === 'secretaria' &&
        (permission.canRead ||
          permission.canCreate ||
          permission.canUpdate ||
          permission.canDelete),
    ),
  );
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const refreshSession = async () => {
      try {
        const nextUser = await request('/auth/me');
        if (!cancelled) setUser(nextUser);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void refreshSession();
    const interval = window.setInterval(() => {
      void refreshSession();
    }, 60000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

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
    await request('/auth/logout', { method: 'POST' });
    setUser(null);
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
  if (user?.mustChangePassword && location.pathname !== '/perfil') {
    return <Navigate to="/perfil" replace />;
  }
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="state-card">Comprobando permisos…</div>;
  return user?.isSuperAdmin ? children : <Navigate to="/gestion" replace />;
}

export function WebContentRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="state-card">Comprobando permisos…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.mustChangePassword) return <Navigate to="/perfil" replace />;
  return canAccessWebContent(user) ? children : <Navigate to="/gestion" replace />;
}
