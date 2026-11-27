import type { AuditHistoryEvent } from '../../../services/api';
import { formatAuditActionLabel } from '../../../utils/auditLabels';

interface ApplicantHistorySectionProps {
  history: AuditHistoryEvent[];
}

export default function ApplicantHistorySection({ history }: ApplicantHistorySectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#000254]">
        Registro de auditoría del expediente
      </h3>
      {history.length === 0 ? (
        <p className="text-xs text-slate-500 py-4 text-center">
          No hay eventos de auditoría registrados todavía para este expediente.
        </p>
      ) : (
        <ul className="space-y-2">
          {history.map((event) => (
            <li
              key={event.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-[#f8f9fc] px-3.5 py-2.5 text-xs"
            >
              <div>
                <strong className="text-[#0c1933]">
                  {formatAuditActionLabel(event.action)}
                </strong>
                <span className="text-slate-500 block text-[11px]">
                  Realizado por:{' '}
                  {event.actor
                    ? `${event.actor.name} (${event.actor.email})`
                    : 'Familia / Formulario público'}
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-500">
                <span>{new Date(event.createdAt).toLocaleString('es-ES')}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
