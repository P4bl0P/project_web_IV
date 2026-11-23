import { useState } from 'react';
import { RefreshCw, ScrollText } from 'lucide-react';
import type { AdminAuditEvent } from '../../services/api';
import { formatAuditActionLabel } from '../../utils/auditLabels';

interface AdminAuditSectionProps {
  events: AdminAuditEvent[];
  loading: boolean;
  onRefresh: (filters?: { result?: 'ALLOWED' | 'DENIED' }) => Promise<void>;
}

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
              Historial de actividad en usuarios, cargos, accesos y expedientes.
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
                    {formatAuditActionLabel(ev.action)}
                  </strong>
                </div>
                <div className="text-[11px] text-[#627089]">
                  {ev.actor
                    ? `${ev.actor.name} (${ev.actor.email})`
                    : ev.action.startsWith('APPLICATION_')
                      ? 'Familia / Formulario público'
                      : 'Sistema'}
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
