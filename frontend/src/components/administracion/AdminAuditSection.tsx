import { useState } from 'react';
import { RefreshCw, ScrollText } from 'lucide-react';
import type { AdminAuditEvent } from '../../services/api';

interface AdminAuditSectionProps {
  events: AdminAuditEvent[];
  loading: boolean;
  onRefresh: (filters?: { result?: 'ALLOWED' | 'DENIED' }) => Promise<void>;
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN_SUCCESS: 'Inicio de sesión',
  LOGIN_FAILED: 'Intento de acceso fallido',
  LOGIN_LOCKED: 'Cuenta bloqueada por intentos fallidos',
  LOGIN_DENIED_INACTIVE: 'Acceso denegado (cuenta inactiva)',
  LOGOUT: 'Cierre de sesión',
  MFA_SETUP_COMPLETED: 'Verificación en dos pasos activada',
  MFA_SETUP_FAILED: 'Configuración MFA fallida',
  MFA_FAILED: 'Código MFA incorrecto',
  MFA_RECONFIGURED: 'Verificación MFA actualizada',
  PASSWORD_CHANGED: 'Contraseña actualizada',
  INITIAL_PASSWORD_CHANGED: 'Contraseña inicial establecida',
  INVITATION_ACCEPTED: 'Invitación aceptada',
  USER_CREATED: 'Usuario creado',
  USER_UPDATED: 'Datos de usuario editados',
  USER_ROLE_CHANGED: 'Cambio de cargo de usuario',
  USER_STATUS_CHANGED: 'Cambio de estado de usuario',
  USER_PASSWORD_RESET: 'Contraseña restablecida',
  USER_MFA_RESET: 'MFA reiniciado',
  USER_DISABLED: 'Usuario desactivado',
  USER_DELETED: 'Usuario eliminado',
  ROLE_CREATED: 'Cargo creado',
  ROLE_UPDATED: 'Cargo editado',
  ROLE_DELETED: 'Cargo eliminado',
  ROLE_PERMISSIONS_UPDATED: 'Permisos de cargo actualizados',
  PERMISSION_CHANGED: 'Permiso actualizado',
  ACCESS_DENIED: 'Acceso denegado',
  COUNCIL_MEMBER_CREATED: 'Consejo: integrante añadido',
  COUNCIL_MEMBER_UPDATED: 'Consejo: integrante editado',
  COUNCIL_MEMBERS_REORDERED: 'Consejo: orden actualizado',
  COUNCIL_MEMBER_DELETED: 'Consejo: integrante eliminado',
  SUPERADMIN_BOOTSTRAPPED: 'Superadministrador inicial creado',
  SUPERADMIN_RECOVERY: 'Recuperación administrativa ejecutada',
};

export default function AdminAuditSection({
  events,
  loading,
  onRefresh,
}: AdminAuditSectionProps) {
  const [resultFilter, setResultFilter] = useState<'' | 'ALLOWED' | 'DENIED'>('');

  return (
    <section className="space-y-4 rounded-[22px] border border-[#e4e9f1] bg-white p-[27px] shadow-[0_7px_25px_rgba(0,5,84,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef1f6] pb-4">
        <div className="flex items-center gap-2 text-[#01317b]">
          <ScrollText size={20} />
          <div>
            <h2 className="m-0 text-[20px] text-[#000254]">Registro de actividad</h2>
            <p className="m-0 text-xs text-[#627089]">
              Historial de cambios en usuarios, cargos, permisos y accesos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filtrar por resultado"
            value={resultFilter}
            onChange={(e) => {
              const next = e.target.value as '' | 'ALLOWED' | 'DENIED';
              setResultFilter(next);
              void onRefresh(next ? { result: next } : undefined);
            }}
            className="rounded-xl border border-[#e4e9f1] bg-white px-3 py-2 text-xs font-semibold text-[#000254]"
          >
            <option value="">Todos</option>
            <option value="ALLOWED">Permitidos</option>
            <option value="DENIED">Denegados</option>
          </select>
          <button
            type="button"
            onClick={() => void onRefresh(resultFilter ? { result: resultFilter } : undefined)}
            className="button button-ghost cursor-pointer min-h-[36px] px-3.5 text-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="m-0 py-8 text-center text-sm text-[#627089]">
          No hay registros de actividad para mostrar.
        </p>
      ) : (
        <div className="divide-y divide-[#eef1f6]">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-xs"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      ev.result === 'DENIED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {ev.result === 'DENIED' ? 'Denegado' : 'Permitido'}
                  </span>
                  <strong className="text-[#000254]">
                    {ACTION_LABELS[ev.action] ?? ev.action}
                  </strong>
                </div>
                <div className="text-[11px] text-[#627089]">
                  {ev.actor ? `${ev.actor.name} (${ev.actor.email})` : 'Sistema'}
                </div>
              </div>

              <span className="text-[11px] text-[#627089]">
                {new Date(ev.createdAt).toLocaleString('es-ES')}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
