import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import type { CouncilMember } from '../../types/conocenos';
import { useLockBodyScroll } from '../../utils/useLockBodyScroll';
import { SecButton } from '../secretaria/secretariaTheme';

interface Props {
  member: CouncilMember;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export default function CouncilDeleteConfirmModal({
  member,
  deleting,
  onCancel,
  onConfirm,
}: Props) {
  useLockBodyScroll();

  return createPortal(
    <div
      className="fixed inset-0 z-50 m-0 h-dvh w-screen overflow-hidden overscroll-none bg-[#0c1933]/45 backdrop-blur-md p-4 flex items-center justify-center animate-sec-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="council-delete-title"
    >
      <div className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-[22px] border border-white/80 bg-white p-6 shadow-[0_24px_64px_-12px_rgba(0,2,84,0.22)] animate-sec-modal">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle size={20} aria-hidden="true" />
            </span>
            <div>
              <h2 id="council-delete-title" className="text-base font-bold text-[#000254]">
                Eliminar integrante del Consejo
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600">
                ¿Seguro que deseas eliminar a <strong>{member.fullName}</strong> ({member.role})?
                Dejará de aparecer en la página pública «Conócenos».
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            aria-label="Cerrar confirmación"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <SecButton variant="secondary" size="md" onClick={onCancel} disabled={deleting}>
            Cancelar
          </SecButton>
          <SecButton
            variant="destructive"
            size="md"
            disabled={deleting}
            onClick={() => void onConfirm()}
          >
            {deleting ? 'Eliminando…' : 'Sí, eliminar'}
          </SecButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
