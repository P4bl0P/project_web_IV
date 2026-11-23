import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Compass,
  FolderKanban,
  Globe,
  Layers,
  Lock,
  Shield,
  Wallet,
} from 'lucide-react';
import {
  canAccessWebContent,
  getRegisteredModules,
  hasModulePermission,
  isSuperAdmin,
  useAuth,
} from '../auth';

const ICON_MAP: Record<string, typeof Layers> = {
  compass: Compass,
  'folder-kanban': FolderKanban,
  wallet: Wallet,
  globe: Globe,
};

export default function GestionPage() {
  const { user } = useAuth();
  const registeredModules = getRegisteredModules(user);
  const webContentAllowed = canAccessWebContent(user, 'canRead');

  const cards = [
    ...registeredModules.map((mod) => {
      const allowed = hasModulePermission(user, mod.key, 'canRead');
      return {
        title: mod.name,
        description: mod.description ?? 'Módulo operativo del grupo.',
        path: mod.route || `/gestion/modulo/${mod.key}`,
        icon: ICON_MAP[mod.icon ?? ''] ?? Layers,
        allowed,
        inDevelopment: mod.isImplemented === false,
      };
    }),
    {
      title: 'Contenido de la web',
      description: 'Gestión pública de integrantes del Consejo de Grupo en Conócenos.',
      path: '/gestion/contenido-web',
      icon: Globe,
      allowed: webContentAllowed,
      inDevelopment: false,
    },
    ...(isSuperAdmin(user)
      ? [
          {
            title: 'Administración',
            description: 'Gestión de usuarios, cargos, permisos por módulo y auditoría.',
            path: '/gestion/administracion',
            icon: Shield,
            allowed: true,
            inDevelopment: false,
          },
        ]
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

      <div className="grid grid-cols-1 gap-[18px] min-[801px]:grid-cols-3">
        {cards.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.path}
              to={mod.path}
              className={`group relative flex min-h-[164px] items-center gap-[15px] rounded-[22px] border p-[25px] no-underline transition-all duration-250 ${
                mod.allowed
                  ? 'border-[#e4e9f1] bg-white shadow-[0_7px_25px_rgba(0,5,84,0.04)] hover:-translate-y-[5px] hover:border-[#bac9e1] hover:shadow-[0_18px_50px_rgba(0,5,84,0.09)]'
                  : 'border-[#e4e9f1] bg-[#f8fafc] text-[#627089] shadow-[0_4px_16px_rgba(0,5,84,0.02)] hover:border-[#d5deec] hover:bg-white'
              }`}
            >
              <span
                className={`grid h-12 w-12 flex-none place-items-center rounded-[15px] ${
                  mod.allowed
                    ? 'bg-[#edf3fb] text-[#01317b]'
                    : 'bg-[#eef1f6] text-[#627089]'
                }`}
              >
                <Icon size={25} />
              </span>

              <span className="grid min-w-0 gap-[5px] pr-5">
                <strong className="flex flex-wrap items-center gap-2 text-[17px] text-[#000254]">
                  <span>{mod.title}</span>
                  {mod.inDevelopment && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      En desarrollo
                    </span>
                  )}
                </strong>
                <small className="text-[11px] text-[#627089]">
                  {mod.allowed ? 'Acceder al módulo' : 'Sin acceso habilitado para tu cargo'}
                </small>
              </span>

              {mod.allowed ? (
                <ArrowUpRight
                  size={19}
                  className="absolute top-5 right-5 text-[#a7b3c5] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#e22328]"
                />
              ) : (
                <Lock
                  size={17}
                  aria-label="Sin acceso"
                  className="absolute top-5 right-5 text-[#9aa7ba]"
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
