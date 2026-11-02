import { Link } from 'react-router-dom';
import { Compass, FolderKanban, Wallet } from 'lucide-react';

const MODULES = [
  { title: 'Jefatura', path: '/gestion/jefatura', icon: Compass },
  { title: 'Secretaría', path: '/gestion/secretaria', icon: FolderKanban },
  { title: 'Tesorería', path: '/gestion/tesoreria', icon: Wallet },
];

export default function GestionPage() {
  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-slate-50 p-6 sm:p-12 flex flex-col justify-center items-center">
      <div className="w-full max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 text-center sm:text-left">
          Gestión · Grupo IV
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.path}
                to={mod.path}
                className="group bg-white hover:bg-indigo-600 border border-slate-200 hover:border-indigo-600 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 shadow-xs hover:shadow-lg transition-all duration-150"
              >
                <Icon
                  size={40}
                  className="text-indigo-600 group-hover:text-white transition-colors"
                />
                <span className="text-xl font-bold text-slate-800 group-hover:text-white transition-colors">
                  {mod.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}