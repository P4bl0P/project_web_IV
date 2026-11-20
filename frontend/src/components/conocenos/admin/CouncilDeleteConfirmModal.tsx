import { AlertTriangle } from 'lucide-react';
import type { CouncilMember } from '../../../types/conocenos';
import { SecButton } from '../../secretaria/secretariaTheme';

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
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0c1933]/40 backdrop-blur-md p-4 flex items-center justify-center animate-sec-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="council-delete-title"
    >
      <div className="w-full max-w-md rounded-[22px] border border-white/80 bg-white p-6 shadow-[0_24px_64px_-12px_rgba(0,2,84,0.22)] animate-sec-modal">
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
    </div>
  );
}
