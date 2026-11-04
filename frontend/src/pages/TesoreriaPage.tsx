import { Link } from 'react-router-dom';
import { Wallet, ArrowLeft, Construction } from 'lucide-react';

export default function TesoreriaPage() {
  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-slate-50 px-4 sm:px-8 lg:px-12 py-8 flex flex-col">
      <div className="mb-6">
        <Link
          to="/gestion"
          className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xs transition"
        >
          <ArrowLeft size={15} />
          Volver a Gestión
        </Link>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
          <Wallet size={32} />
        </div>
        <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full mb-3">
          <Construction size={14} /> Módulo en desarrollo
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Tesorería
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-md">
          Próximamente aquí podrás gestionar las remesas bancarias SEPA, el control de cuotas trimestrales y los presupuestos de acampadas.
        </p>
      </div>
    </div>
  );
}