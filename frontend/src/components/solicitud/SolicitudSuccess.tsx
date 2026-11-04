import { CheckCircle2, UserPlus } from 'lucide-react';

interface Props {
  submittedChildren: Array<{ name: string; branch: string }>;
  onAddSibling: () => void;
}

export default function SolicitudSuccess({ submittedChildren, onAddSibling }: Props) {
  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl shadow-lg p-8 text-center border border-emerald-100">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Solicitud registrada con éxito!</h2>

        <div className="my-4 space-y-2">
          {submittedChildren.map((child, idx) => (
            <div
              key={idx}
              className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 flex items-center justify-between"
            >
              <span className="font-semibold">{child.name}</span>
              <span className="text-xs font-bold bg-indigo-600 text-white px-2.5 py-1 rounded-full">
                {child.branch}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 text-blue-900 text-xs sm:text-sm rounded-2xl p-4 text-left mb-6 space-y-2">
          <p className="font-semibold">¿Qué ocurre a partir de ahora?</p>
          <p>1. El Kraal revisará la solicitud y quedará en la lista de espera oficial del Grupo IV.</p>
          <p>
            2. Cuando haya plaza en su rama, recibiréis un <strong>enlace directo por WhatsApp</strong> para
            completar la ficha médica sin tener que repetir estos datos.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddSibling}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl font-semibold shadow-sm transition w-full"
        >
          <UserPlus size={18} />
          Inscribir a otro hermano/a (conservando mis datos)
        </button>
      </div>
    </div>
  );
}