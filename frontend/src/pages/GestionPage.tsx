import { Link } from 'react-router-dom';
import { ArrowUpRight, Compass, FolderKanban, Globe, Shield, Wallet } from 'lucide-react';
import { canAccessWebContent, hasModulePermission, useAuth } from '../auth';

const MODULES = [
  { title: 'Jefatura', moduleName: 'Jefatura', path: '/gestion/jefatura', icon: Compass },
  { title: 'Secretaría', moduleName: 'Secretaría', path: '/gestion/secretaria', icon: FolderKanban },
  { title: 'Tesorería', moduleName: 'Tesorería', path: '/gestion/tesoreria', icon: Wallet },
];

export default function GestionPage() {
  const { user } = useAuth();
  const modules = [
    ...MODULES.filter((mod) => hasModulePermission(user, mod.moduleName, 'canRead')),
    ...(canAccessWebContent(user)
      ? [{ title: 'Contenido de la web', moduleName: 'Contenido', path: '/gestion/contenido-web', icon: Globe }]
      : []),
    ...(user?.isSuperAdmin
      ? [{ title: 'Administración', moduleName: 'Admin', path: '/gestion/administracion', icon: Shield }]
      : []),
  ];

  return (
    <div className="page-width pt-[35px] pb-[52px] min-[801px]:pt-16 min-[801px]:pb-20">
      <div className="mb-[42px] flex flex-col items-start justify-between gap-[15px] min-[801px]:flex-row min-[801px]:items-start">
        <div>
          <span className="section-kicker">Área privada</span>
          <h1 className="mt-[10px] mb-[9px] text-[clamp(34px,5vw,54px)] tracking-[-0.06em] text-[#000254]">
            Gestión del grupo
          </h1>
          <p className="m-0 text-[#627089]">
            Todo lo que necesitas para cuidar la vida del Grupo IV.
          </p>
        </div>
      </div>

      {modules.length === 0 ? (
        <div className="rounded-[22px] border border-[#e4e9f1] bg-white p-8 text-center text-sm text-[#627089]">
          Tu cuenta todavía no tiene módulos habilitados. Contacta con el administrador para asignar tus permisos.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[18px] min-[801px]:grid-cols-3">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.path}
                to={mod.path}
                className="group relative flex min-h-[156px] items-center gap-[15px] rounded-[22px] border border-[#e4e9f1] bg-white p-[25px] no-underline shadow-[0_7px_25px_rgba(0,5,84,0.04)] transition-all duration-250 hover:-translate-y-[5px] hover:border-[#bac9e1] hover:shadow-[0_18px_50px_rgba(0,5,84,0.09)]"
              >
                <span className="grid h-12 w-12 place-items-center rounded-[15px] bg-[#edf3fb] text-[#01317b]">
                  <Icon size={25} />
                </span>
                <span className="grid gap-[5px]">
                  <strong className="text-[17px] text-[#000254]">{mod.title}</strong>
                  <small className="text-[11px] text-[#627089]">Acceder al módulo</small>
                </span>
                <ArrowUpRight
                  size={19}
                  className="absolute top-5 right-5 text-[#a7b3c5] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#e22328]"
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
