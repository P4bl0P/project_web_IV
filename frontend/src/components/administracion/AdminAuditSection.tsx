import { useState } from 'react';
import { RefreshCw, ScrollText } from 'lucide-react';
import type { AdminAuditEvent } from '../../services/api';

interface AdminAuditSectionProps {
  events: AdminAuditEvent[];
  loading: boolean;
  onRefresh: (filters?: { action?: string; result?: 'ALLOWED' | 'DENIED' }) => Promise<void>;
}

export default function AdminAuditSection({
  events,
  loading,
  onRefresh,
}: AdminAuditSectionProps) {
  const [actionFilter, setActionFilter] = useState('');
  const [resultFilter, setResultFilter] = useState<'' | 'ALLOWED' | 'DENIED'>('');

  const applyFilters = () => {
    void onRefresh({
      action: actionFilter.trim() || undefined,
      result: resultFilter || undefined,
    });
  };

  return (
    <section className="space-y-4 rounded-[22px] border border-[#e4e9f1] bg-white p-[27px] shadow-[0_7px_25px_rgba(0,5,84,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef1f6] pb-4">
        <div className="flex items-center gap-2 text-[#01317b]">
          <ScrollText size={20} />
          <div>
            <h2 className="m-0 text-[20px] text-[#000254]">Registro de auditoría</h2>
            <p className="m-0 text-xs text-[#627089]">
              Consulta de solo lectura de cambios administrativos, accesos y eventos de seguridad.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            aria-label="Filtrar por acción"
            placeholder="Acción (ej. ROLE_PERMISSIONS_UPDATED)"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-xl border border-[#e4e9f1] bg-white px-3 py-2 text-xs"
          />
          <select
            aria-label="Filtrar por resultado"
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value as '' | 'ALLOWED' | 'DENIED')}
            className="rounded-xl border border-[#e4e9f1] bg-white px-3 py-2 text-xs font-semibold text-[#000254]"
          >
            <option value="">Todos los resultados</option>
            <option value="ALLOWED">Permitidos</option>
            <option value="DENIED">Denegados</option>
          </select>
          <button
            type="button"
            onClick={applyFilters}
            className="button button-ghost cursor-pointer min-h-[36px] px-3.5 text-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Consultar
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="m-0 py-8 text-center text-sm text-[#627089]">
          No hay registros de auditoría para los filtros seleccionados.
        </p>
      ) : (
        <div className="space-y-2.5">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="rounded-xl border border-[#eef1f6] bg-[#fafbfd] p-3.5 text-xs space-y-1.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      ev.result === 'DENIED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {ev.result}
                  </span>
                  <strong className="font-mono text-[#000254]">{ev.action}</strong>
                  {ev.resource && <span className="text-[#627089]">· {ev.resource}</span>}
                </div>
                <span className="text-[11px] text-[#627089]">
                  {new Date(ev.createdAt).toLocaleString('es-ES')}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 text-[11px] text-[#627089]">
                <span>
                  Actor:{' '}
                  <strong className="text-[#0c1933]">
                    {ev.actor ? `${ev.actor.name} (${ev.actor.email})` : 'Sistema / Anónimo'}
                  </strong>
                </span>
                {ev.ipAddress && <span>IP: {ev.ipAddress}</span>}
              </div>

              {(ev.previousValues !== undefined && ev.previousValues !== null) ||
              (ev.newValues !== undefined && ev.newValues !== null) ? (
                <details className="pt-1">
                  <summary className="cursor-pointer text-[11px] font-bold text-[#01317b]">
                    Ver detalle del cambio
                  </summary>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {ev.previousValues !== undefined && ev.previousValues !== null && (
                      <pre className="m-0 overflow-x-auto rounded-lg border border-[#e4e9f1] bg-white p-2 text-[10px] text-[#627089]">
                        {JSON.stringify(ev.previousValues, null, 2)}
                      </pre>
                    )}
                    {ev.newValues !== undefined && ev.newValues !== null && (
                      <pre className="m-0 overflow-x-auto rounded-lg border border-[#dce6f5] bg-white p-2 text-[10px] text-[#000254]">
                        {JSON.stringify(ev.newValues, null, 2)}
                      </pre>
                    )}
                  </div>
                </details>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
