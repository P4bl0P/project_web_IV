import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Trash2,
  Undo2,
  UserCheck,
  UserMinus,
  X,
} from 'lucide-react';
import {
  CLOSURE_REASON_LABELS,
  type ApplicantRecord,
  type ClosureReason,
} from '../../services/api';
import { useLockBodyScroll } from '../../utils/useLockBodyScroll';
import { SecButton } from './secretariaTheme';
import { secFilterControlClass, secTokens } from './secretariaTokens';

export type SecretariaConfirmAction =
  | { type: 'VALIDATE'; record: ApplicantRecord }
  | { type: 'OFFER_SPOT'; record: ApplicantRecord }
  | { type: 'RENEW_TOKEN'; record: ApplicantRecord }
  | { type: 'RETURN_WAITLIST'; record: ApplicantRecord }
  | { type: 'MARK_REVIEWED'; record: ApplicantRecord }
  | { type: 'ADMIT_CENSUS'; record: ApplicantRecord }
  | { type: 'DEACTIVATE'; record: ApplicantRecord }
  | { type: 'REACTIVATE'; record: ApplicantRecord }
  | { type: 'DELETE'; record: ApplicantRecord }
  | { type: 'WHATSAPP_PREVIEW'; record: ApplicantRecord; message: string; phone: string };

interface Props {
  action: SecretariaConfirmAction;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (payload?: {
    closureReason?: ClosureReason;
    closureNotes?: string;
    reason?: string;
    notes?: string;
  }) => Promise<void>;
}

const CLOSURE_REASONS = Object.keys(CLOSURE_REASON_LABELS) as ClosureReason[];

export default function SecretariaConfirmModal({ action, busy, onCancel, onConfirm }: Props) {
  useLockBodyScroll();

  const [closureReason, setClosureReason] = useState<ClosureReason>('BAJA_VOLUNTARIA');
  const [closureNotes, setClosureNotes] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [copiedMsg, setCopiedMsg] = useState(false);

  const fullName = `${action.record.childFirstName} ${action.record.childLastName}`;

  if (action.type === 'WHATSAPP_PREVIEW') {
    const handleCopyMsg = () => {
      void navigator.clipboard.writeText(action.message);
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2000);
    };

    return createPortal(
      <div
        className={`${secTokens.modalBackdrop} z-[60]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sec-confirm-title"
      >
        <div className="w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-[22px] border border-white/80 bg-white p-6 shadow-[0_24px_64px_-12px_rgba(0,2,84,0.22)] animate-sec-modal space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <MessageCircle size={20} />
              </span>
              <div>
                <h2 id="sec-confirm-title" className="text-base font-bold text-[#000254]">
                  Simulación de WhatsApp (Modo Seguro)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Destinatario: <strong className="text-slate-700">{action.phone}</strong> · No se
                  ha enviado ningún mensaje externo.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Cerrar vista previa"
            >
              <X size={16} />
            </button>
          </div>

          <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-[#f8f9fc] p-4 text-xs text-slate-700 font-sans leading-relaxed">
            {action.message}
          </pre>

          <div className="flex items-center justify-end">
            <SecButton variant="whatsapp" size="md" onClick={handleCopyMsg}>
              {copiedMsg ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedMsg ? 'Mensaje copiado' : 'Copiar mensaje'}</span>
            </SecButton>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  const getDialogMeta = () => {
    switch (action.type) {
      case 'VALIDATE':
        return {
          title: 'Validar solicitud a Lista de Espera',
          description: `¿Confirmas que la solicitud inicial de ${fullName} es correcta? Pasará de "Pendiente de revisión" a "Lista de espera" conservando su prioridad y fecha de llegada.`,
          icon: <CheckCircle2 size={20} />,
          iconClass: 'bg-amber-50 text-amber-600',
          confirmLabel: 'Sí, validar solicitud',
          variant: 'warning' as const,
        };
      case 'OFFER_SPOT':
        return {
          title: 'Ofertar plaza y generar enlace mágico',
          description: `Se ofertará plaza a ${fullName} en ${action.record.calculatedBranch} y se generará un enlace mágico único de un solo uso válido durante 7 días para que la familia complete la inscripción oficial.`,
          icon: <Send size={20} />,
          iconClass: 'bg-blue-50 text-[#01317b]',
          confirmLabel: 'Ofertar plaza',
          variant: 'primary' as const,
        };
      case 'RENEW_TOKEN':
        return {
          title: 'Renovar enlace mágico',
          description: `El enlace anterior de ${fullName} quedará invalidado inmediatamente y se generará un nuevo enlace único válido durante 7 días. Si la inscripción ya estaba completada, volverá a estado "Plaza ofertada" para que la familia la reenvíe.`,
          icon: <RefreshCw size={20} />,
          iconClass: 'bg-blue-50 text-[#01317b]',
          confirmLabel: 'Generar nuevo enlace',
          variant: 'primary' as const,
        };
      case 'RETURN_WAITLIST':
        return {
          title: 'Devolver a Lista de Espera',
          description: `${fullName} volverá a "Lista de espera" y su enlace mágico actual quedará invalidado de inmediato.`,
          icon: <Undo2 size={20} />,
          iconClass: 'bg-amber-50 text-amber-700',
          confirmLabel: 'Volver a lista de espera',
          variant: 'warning' as const,
        };
      case 'MARK_REVIEWED':
        return {
          title: 'Marcar inscripción como revisada',
          description: `Confirmas que Secretaría ha verificado los datos personales, la ficha médica, la domiciliación SEPA y las firmas de ${fullName}.`,
          icon: <ShieldCheck size={20} />,
          iconClass: 'bg-emerald-50 text-emerald-700',
          confirmLabel: 'Marcar como revisada',
          variant: 'success' as const,
        };
      case 'ADMIT_CENSUS':
        return {
          title: 'Censar oficialmente en el Grupo IV',
          description: `${fullName} pasará al Censo Oficial en ${action.record.calculatedBranch} (Ronda ${action.record.solarRound || 'actual'}). Se registrará la fecha efectiva de alta de hoy, tu usuario de Secretaría y la rama asignada.`,
          icon: <UserCheck size={20} />,
          iconClass: 'bg-emerald-50 text-emerald-700',
          confirmLabel: 'Confirmar alta en censo',
          variant: 'success' as const,
        };
      case 'DEACTIVATE':
        return {
          title: 'Dar de baja / Cerrar expediente',
          description: `${fullName} pasará al apartado de Bajas conservando el motivo estructurado y su historial. Cualquier enlace mágico activo será invalidado.`,
          icon: <UserMinus size={20} />,
          iconClass: 'bg-rose-50 text-rose-600',
          confirmLabel: 'Confirmar baja',
          variant: 'destructive' as const,
        };
      case 'REACTIVATE':
        return {
          title: 'Reactivar expediente desde Baja',
          description: `El expediente de ${fullName} volverá a su último estado activo autorizado según la documentación ya completada.`,
          icon: <RotateCcw size={20} />,
          iconClass: 'bg-blue-50 text-[#01317b]',
          confirmLabel: 'Reactivar expediente',
          variant: 'primary' as const,
        };
      case 'DELETE':
        return {
          title: 'Eliminar expediente permanentemente',
          description: `Esta operación excepcional eliminará por completo el expediente de ${fullName} de la base de datos y no se puede deshacer. Para bajas ordinarias utiliza "Dar de baja".`,
          icon: <Trash2 size={20} />,
          iconClass: 'bg-rose-50 text-rose-600',
          confirmLabel: 'Sí, eliminar definitivamente',
          variant: 'destructive' as const,
        };
    }
  };

  const meta = getDialogMeta();
  const missingCensus =
    action.type === 'ADMIT_CENSUS' ? action.record.missingForCensus ?? [] : [];
  const blockedCensus = action.type === 'ADMIT_CENSUS' && !action.record.canAdmitToCensus;

  const handleConfirmClick = () => {
    if (action.type === 'DEACTIVATE') {
      void onConfirm({
        closureReason,
        closureNotes: closureNotes.trim() || undefined,
      });
      return;
    }
    if (action.type === 'RETURN_WAITLIST') {
      void onConfirm({ reason: reasonText.trim() || undefined });
      return;
    }
    if (action.type === 'REACTIVATE') {
      void onConfirm({ notes: reasonText.trim() || undefined });
      return;
    }
    void onConfirm();
  };

  return createPortal(
    <div
      className={`${secTokens.modalBackdrop} z-[60]`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sec-confirm-title"
    >
      <div className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-[22px] border border-white/80 bg-white p-6 shadow-[0_24px_64px_-12px_rgba(0,2,84,0.22)] animate-sec-modal space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${meta.iconClass}`}
            >
              {meta.icon}
            </span>
            <div className="min-w-0">
              <h2 id="sec-confirm-title" className="text-base font-bold text-[#000254]">
                {meta.title}
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600">
                {meta.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            aria-label="Cerrar diálogo"
          >
            <X size={16} />
          </button>
        </div>

        {blockedCensus && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 space-y-1.5">
            <p className="font-bold inline-flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-600" />
              No cumple todos los requisitos para censar
            </p>
            {missingCensus.length > 0 && (
              <ul className="list-disc pl-4 space-y-0.5 text-amber-900">
                {missingCensus.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {action.type === 'DEACTIVATE' && (
          <div className="space-y-3 pt-1">
            <div>
              <label
                htmlFor="closure-reason-select"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Motivo estructurado de baja *
              </label>
              <select
                id="closure-reason-select"
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value as ClosureReason)}
                className={secFilterControlClass('cursor-pointer')}
              >
                {CLOSURE_REASONS.map((key) => (
                  <option key={key} value={key}>
                    {CLOSURE_REASON_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="closure-notes-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Observaciones internas (opcional)
              </label>
              <textarea
                id="closure-notes-input"
                rows={2}
                value={closureNotes}
                onChange={(e) => setClosureNotes(e.target.value)}
                placeholder="Contexto adicional sobre la baja o cierre..."
                className="w-full rounded-xl border border-slate-200/95 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#01317b] focus:ring-3 focus:ring-[#01317b]/12 outline-none"
              />
            </div>
          </div>
        )}

        {(action.type === 'RETURN_WAITLIST' || action.type === 'REACTIVATE') && (
          <div>
            <label
              htmlFor="action-notes-input"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              {action.type === 'RETURN_WAITLIST'
                ? 'Motivo del retorno a lista de espera (opcional)'
                : 'Nota de reactivación (opcional)'}
            </label>
            <input
              id="action-notes-input"
              type="text"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Ej. Solicitan aplazar incorporación al próximo trimestre..."
              className={secFilterControlClass()}
            />
          </div>
        )}

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <SecButton variant="secondary" size="md" onClick={onCancel} disabled={busy}>
            Cancelar
          </SecButton>
          <SecButton
            variant={meta.variant}
            size="md"
            disabled={busy || blockedCensus}
            onClick={handleConfirmClick}
          >
            {busy ? 'Procesando…' : meta.confirmLabel}
          </SecButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
