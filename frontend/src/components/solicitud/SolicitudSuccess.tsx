import { ArrowLeft, CheckCircle2, FilePlus2, MessageCircle, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SecBadge, SecButton } from '../secretaria/secretariaTheme';
import { getBranchVisualConfig } from '../secretaria/secretariaTokens';

interface Props {
  submittedChildren: Array<{ name: string; branch: string }>;
  onAddSibling: () => void;
  onStartFresh?: () => void;
}

export default function SolicitudSuccess({
  submittedChildren,
  onAddSibling,
  onStartFresh,
}: Props) {
  return (
    <div className="min-h-[calc(100vh-76px)] bg-gradient-to-b from-[#f8fafd] via-white to-[#f5f7fb] py-10 sm:py-16">
      <div className="page-width max-w-2xl">
        <div className="reveal rounded-[28px] border border-slate-200/90 bg-white p-6 sm:p-10 text-center shadow-[0_24px_60px_-12px_rgba(0,2,84,0.12)]">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 shadow-2xs">
            <CheckCircle2 size={34} aria-hidden="true" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-800">
            Registro completado
          </span>

          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-[#000254]">
            ¡Solicitud registrada con éxito!
          </h1>
          <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-[#627089]">
            Hemos recibido correctamente la solicitud de plaza en la lista de espera del Grupo Scout IV San José de Calasanz.
          </p>

          <div className="my-6 space-y-2.5 text-left">
            {submittedChildren.map((child, idx) => {
              const branchConfig = getBranchVisualConfig(child.branch);
              return (
                <div
                  key={`${child.name}-${idx}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#01317b]/15 bg-[#f5f8fd] px-4 py-3 text-sm text-[#0c1933]"
                >
                  <span className="font-bold text-[#000254]">{child.name}</span>
                  <SecBadge tone={branchConfig.tone} dotColor={branchConfig.dotColor}>
                    {child.branch}
                  </SecBadge>
                </div>
              );
            })}
          </div>

          <div className="mb-7 rounded-2xl border border-slate-200/85 bg-[#f8f9fc] p-5 text-left text-xs sm:text-sm text-[#0c1933] space-y-2.5">
            <p className="flex items-center gap-2 font-bold text-[#000254]">
              <MessageCircle size={16} className="text-[#01317b] shrink-0" aria-hidden="true" />
              ¿Qué ocurre a partir de ahora?
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-[13px] leading-relaxed text-[#53617a]">
              <li>
                El Kraal revisará la solicitud y quedará registrada en la lista de espera oficial del Grupo IV.
              </li>
              <li>
                Cuando haya plaza disponible en su rama, recibiréis un{' '}
                <strong className="text-[#0c1933]">enlace directo por WhatsApp</strong> para completar la inscripción oficial sin tener que repetir estos datos.
              </li>
            </ol>
          </div>

          <div className="space-y-3">
            <SecButton
              variant="primary"
              size="lg"
              onClick={onAddSibling}
              className="w-full min-h-[48px] rounded-xl text-sm font-bold"
            >
              <UserPlus size={17} aria-hidden="true" />
              <span>Inscribir a otro hermano/a (conservando datos de tutores)</span>
            </SecButton>

            {onStartFresh && (
              <SecButton
                variant="secondary"
                size="lg"
                onClick={onStartFresh}
                className="w-full min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold"
              >
                <FilePlus2 size={16} aria-hidden="true" />
                <span>Realizar una nueva solicitud desde cero</span>
              </SecButton>
            )}

            <div className="pt-2">
              <Link
                to="/home"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#01317b] hover:text-[#000254] hover:underline"
              >
                <ArrowLeft size={14} aria-hidden="true" />
                Volver a la página de inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
