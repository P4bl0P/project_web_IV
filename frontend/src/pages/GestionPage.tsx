import { Link } from 'react-router-dom';
import { Compass, FolderKanban, Wallet, Shield, PlusCircle, ArrowRight } from 'lucide-react';

const DEPARTMENTS = [
  {
    title: 'Jefatura',
    subtitle: 'Coordinación y Kraal',
    description: 'Gestión de ramas, responsables, programación de ronda solar y estadísticas generales.',
    path: '/gestion/jefatura',
    icon: Compass,
    color: 'from-indigo-600 to-blue-700',
    status: 'En desarrollo',
  },
  {
    title: 'Secretaría',
    subtitle: 'Solicitudes, Lista de Espera y Censo',
    description: 'Administración de solicitudes de entrada, criterios de admisión, enlaces mágicos, importación Excel y PDFs oficiales.',
    path: '/gestion/secretaria',
    icon: FolderKanban,
    color: 'from-emerald-600 to-teal-700',
    status: 'Activo',
  },
  {
    title: 'Tesorería',
    subtitle: 'Cuotas, Remesas SEPA y Presupuestos',
    description: 'Control de pagos, domiciliaciones bancarias, contabilidad del grupo y balances.',
    path: '/gestion/tesoreria',
    icon: Wallet,
    color: 'from-amber-600 to-orange-700',
    status: 'En desarrollo',
  },
];

export default function GestionPage() {
  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-slate-50 px-4 sm:px-8 lg:px-12 py-8 flex flex-col">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-lg mb-8">
        <span className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-3">
          <Shield size={14} /> Área Privada del Kraal · Grupo IV
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Panel de Gestión · Grupo Scout San José de Calasanz
        </h1>
        <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
          Selecciona el departamento al que deseas acceder.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 flex-1">
        {DEPARTMENTS.map((dept) => {
          const Icon = dept.icon;
          const isActive = dept.status === 'Activo';
          return (
            <Link
              key={dept.path}
              to={dept.path}
              className="group bg-white rounded-3xl border border-slate-200 p-7 text-left shadow-xs hover:shadow-xl hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${dept.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition`}
                  >
                    <Icon size={28} />
                  </div>
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {dept.status}
                  </span>
                </div>

                <h2 className="text-2xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition">
                  {dept.title}
                </h2>
                <p className="text-sm font-semibold text-indigo-600 mt-1">
                  {dept.subtitle}
                </p>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                  {dept.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-indigo-600">
                <span>Acceder a {dept.title}</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
              </div>
            </Link>
          );
        })}

        {/* Hueco preparado para futuros botones */}
        <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-100/50 p-7 flex flex-col items-center justify-center text-center text-slate-500 min-h-[260px]">
          <PlusCircle size={36} className="text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-700">
            Futuros Módulos
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Espacio reservado para Intendencia, Ramas, Campamentos o Calendario.
          </p>
        </div>
      </div>
    </div>
  );
}