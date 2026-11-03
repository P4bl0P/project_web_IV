import { Link } from 'react-router-dom';
import { ArrowUpRight, Compass, FolderKanban, Wallet } from 'lucide-react';

const MODULES = [
  { title: 'Jefatura', path: '/gestion/jefatura', icon: Compass },
  { title: 'Secretaría', path: '/gestion/secretaria', icon: FolderKanban },
  { title: 'Tesorería', path: '/gestion/tesoreria', icon: Wallet },
];

export default function GestionPage() {
  return (
    <div className="management-page page-width">
      <div className="page-heading"><div><span className="section-kicker">Área privada</span><h1>Gestión del grupo</h1><p>Todo lo que necesitas para cuidar la vida del Grupo IV.</p></div></div>

        <div className="module-grid">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.path}
                to={mod.path}
                className="module-card"
              >
                <span className="module-icon"><Icon size={25} /></span>
                <span className="module-card-copy"><strong>{mod.title}</strong><small>Acceder al módulo</small></span>
                <ArrowUpRight size={19} className="module-arrow" />
              </Link>
            );
          })}
        </div>
    </div>
  );
}