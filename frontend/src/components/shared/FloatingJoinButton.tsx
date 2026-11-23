import { ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth';

const HIDDEN_PATH_PREFIXES = ['/solicitud', '/login', '/inscripcion', '/perfil', '/gestion'];

/**
 * Floating call-to-action button that invites unauthenticated visitors
 * to start the group application flow.
 */
export default function FloatingJoinButton() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading || user) {
    return null;
  }

  if (HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <Link
      to="/solicitud"
      aria-label="¡Únete al grupo! Ir a la solicitud de plaza"
      className="reveal group fixed right-[max(1rem,env(safe-area-inset-right,0px))] bottom-[max(1rem,env(safe-area-inset-bottom,0px))] z-40 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/25 bg-[#e22328] pl-3.5 pr-2.5 py-2 text-[12.5px] font-bold tracking-[-0.01em] text-white no-underline shadow-[0_12px_28px_rgba(226,35,40,0.34),0_4px_14px_rgba(0,2,84,0.16)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#c81b20] hover:shadow-[0_16px_34px_rgba(226,35,40,0.42),0_6px_16px_rgba(0,2,84,0.18)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-[#000254]/50 focus-visible:outline-offset-[3px] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 min-[801px]:right-[max(1.75rem,env(safe-area-inset-right,0px))] min-[801px]:bottom-[max(1.75rem,env(safe-area-inset-bottom,0px))] min-[801px]:min-h-[48px] min-[801px]:gap-2.5 min-[801px]:pl-5 min-[801px]:pr-3.5 min-[801px]:py-2.5 min-[801px]:text-[14px]"
    >
      <span className="min-[360px]:hidden">¡Únete!</span>
      <span className="hidden min-[360px]:inline">¡Únete al grupo!</span>
      <span
        className="grid h-5 w-5 flex-none place-items-center rounded-full bg-white/20 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 min-[801px]:h-6 min-[801px]:w-6"
        aria-hidden="true"
      >
        <ArrowRight size={13} strokeWidth={2.5} className="min-[801px]:hidden" />
        <ArrowRight size={14} strokeWidth={2.5} className="hidden min-[801px]:block" />
      </span>
    </Link>
  );
}
