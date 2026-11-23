import { ArrowLeft, Compass, FolderKanban, Globe, Layers, Lock, ShieldAlert, UserRound, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAccessibleModules, useAuth, type RegisteredModule } from '../../auth';

interface AccessDeniedViewProps {
  moduleName: string;
  reason?: string;
  isAdminOnly?: boolean;
}

const MODULE_ICONS: Record<string, typeof Layers> = {
  compass: Compass,
  'folder-kanban': FolderKanban,
  wallet: Wallet,
  globe: Globe,
};

function resolveModuleIcon(icon?: string | null) {
  if (!icon) return Layers;
  return MODULE_ICONS[icon] ?? Layers;
}

export default function AccessDeniedView({
  moduleName,
  reason,
  isAdminOnly = false,
}: AccessDeniedViewProps) {
  const { user } = useAuth();
  const accessibleModules: RegisteredModule[] = getAccessibleModules(user);
  const roleLabel = user?.isSuperAdmin
    ? 'Superadministrador'
    : user?.role?.name ?? 'Sin cargo asignado';

  return (
    <div className="page-width pt-8 pb-20 min-[801px]:pt-14">
      <div className="mb-6">
        <Link
          to="/gestion"
          className="inline-flex items-center gap-2 rounded-xl border border-[#e4e9f1] bg-white px-4 py-2.5 text-xs font-bold text-[#01317b] no-underline shadow-[0_2px_10px_rgba(0,5,84,0.04)] transition hover:bg-[#f5f7fb]"
        >
          <ArrowLeft size={15} />
          Volver al panel de gestión
        </Link>
      </div>

      <section
        className="mx-auto max-w-[740px] rounded-[24px] border border-[#e4e9f1] bg-white p-8 sm:p-10 shadow-[0_18px_50px_rgba(0,5,84,0.09)]"
        role="alert"
        aria-labelledby="access-denied-title"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-[#f5c2c4] bg-[#fef2f2] text-[#e22328]">
            {isAdminOnly ? <ShieldAlert size={30} /> : <Lock size={28} />}
          </div>

          <span className="section-kicker">Acceso restringido</span>
          <h1
            id="access-denied-title"
            className="mt-2.5 mb-2 text-[clamp(24px,3.5vw,34px)] font-extrabold tracking-[-0.04em] text-[#000254]"
          >
            No tienes acceso a {moduleName}
          </h1>
          <p className="m-0 max-w-lg text-sm leading-relaxed text-[#627089]">
            {reason ??
              (isAdminOnly
                ? 'Esta sección está reservada exclusivamente para la cuenta de superadministración.'
                : 'Tu cargo actual no dispone de permisos habilitados para acceder a este módulo o realizar esta operación.')}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#dce6f5] bg-[#f4f8fd] px-3.5 py-1.5 text-xs font-bold text-[#01317b]">
            <span>Cargo actual:</span>
            <span>{roleLabel}</span>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link to="/gestion" className="button button-primary">
              <ArrowLeft size={16} />
              Ir al panel de gestión
            </Link>
            <Link to="/perfil" className="button button-ghost">
              <UserRound size={16} />
              Mi perfil
            </Link>
          </div>
        </div>

        {accessibleModules.length > 0 && (
          <div className="mt-9 border-t border-[#eef1f6] pt-6">
            <h2 className="m-0 mb-3 text-center text-xs font-extrabold uppercase tracking-[0.12em] text-[#627089]">
              Módulos disponibles para tu cuenta
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {accessibleModules.map((mod) => {
                const Icon = resolveModuleIcon(mod.icon);
                const targetRoute = mod.route || `/gestion/modulo/${mod.key}`;
                return (
                  <Link
                    key={mod.key}
                    to={targetRoute}
                    className="flex items-center gap-3 rounded-2xl border border-[#e4e9f1] bg-[#f8fafc] px-4 py-3 text-left no-underline transition hover:border-[#bac9e1] hover:bg-white"
                  >
                    <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-[#edf3fb] text-[#01317b]">
                      <Icon size={19} />
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-sm text-[#000254]">
                        {mod.name}
                      </strong>
                      <span className="block truncate text-[11px] text-[#627089]">
                        Acceder al módulo
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
