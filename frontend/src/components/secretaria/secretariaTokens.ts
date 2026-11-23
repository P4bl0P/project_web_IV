import type { ApplicationStatus } from '../../services/api';
import type { SecretariaTab } from '../../utils/secretariaSearchFilter';

/**
 * Tokens y sistema de diseño de Secretaría
 * Inspirado en el lenguaje visual de Apple adaptado a la identidad del Grupo IV Scout:
 * - Azul marino corporativo (--navy: #000254), azul real (--blue: #01317b), rojo scout (--red: #e22328)
 * - Superficies translúcidas tipo cristal, bordes sutiles, tipografía nítida y microinteracciones fluidas.
 */

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'destructive'
  | 'success'
  | 'whatsapp'
  | 'warning';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

export const secTokens = {
  pageBg: 'bg-[#f5f6f9]',
  surface:
    'bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-[0_2px_12px_-3px_rgba(12,25,51,0.05),0_1px_3px_rgba(12,25,51,0.03)]',
  surfaceElevated:
    'bg-white border border-slate-200/90 rounded-2xl shadow-[0_10px_32px_-8px_rgba(0,2,84,0.08),0_2px_6px_rgba(12,25,51,0.03)]',
  surfaceSubtle: 'bg-[#f8f9fc] border border-slate-200/75 rounded-xl',
  cardInteractive:
    'bg-white border border-slate-200/85 rounded-2xl shadow-[0_2px_10px_-3px_rgba(12,25,51,0.04)] hover:border-slate-300/95 hover:shadow-[0_12px_28px_-8px_rgba(0,2,84,0.08)] transition-all duration-200 ease-out',
  modalBackdrop:
    'fixed inset-0 z-50 m-0 h-dvh w-screen overflow-hidden overscroll-none bg-[#0c1933]/45 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center animate-sec-backdrop',
  modalPanel:
    'relative flex flex-col w-full max-w-4xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] overflow-hidden rounded-[24px] bg-[#f8f9fc] border border-white/80 shadow-[0_24px_64px_-12px_rgba(0,2,84,0.22),0_4px_16px_rgba(12,25,51,0.08)] animate-sec-modal',
  focusRing:
    'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#01317b]/20 focus-visible:border-[#01317b]',
};

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-[#01317b] text-white border border-[#000254]/20 shadow-[0_2px_8px_rgba(1,49,123,0.22),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-[#000254] hover:shadow-[0_4px_14px_rgba(0,2,84,0.28)]',
  secondary:
    'bg-white text-slate-700 border border-slate-200/95 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300',
  tertiary:
    'bg-transparent text-slate-600 border border-transparent hover:bg-slate-100/90 hover:text-slate-900',
  destructive:
    'bg-rose-50/80 text-rose-700 border border-rose-200/80 hover:bg-rose-100/90 hover:text-rose-800 hover:border-rose-300',
  success:
    'bg-emerald-600 text-white border border-emerald-700/20 shadow-[0_2px_8px_rgba(5,150,105,0.22),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-emerald-700 hover:shadow-[0_4px_12px_rgba(5,150,105,0.28)]',
  whatsapp:
    'bg-[#15803d] text-white border border-green-800/20 shadow-[0_2px_8px_rgba(21,128,61,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-[#166534]',
  warning:
    'bg-amber-500 text-white border border-amber-600/20 shadow-[0_2px_8px_rgba(245,158,11,0.22),inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-amber-600',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-[11px] font-semibold rounded-lg gap-1',
  sm: 'h-8 px-3 text-xs font-semibold rounded-[10px] gap-1.5',
  md: 'h-9 px-3.5 text-xs font-semibold rounded-xl gap-1.5',
  lg: 'h-10 px-4 text-xs sm:text-[13px] font-semibold rounded-xl gap-2',
  icon: 'h-9 w-9 p-0 rounded-xl justify-center',
};

export function secButtonClass({
  variant = 'secondary',
  size = 'md',
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return [
    'inline-flex items-center justify-center select-none whitespace-nowrap cursor-pointer',
    'transition-all duration-150 ease-out active:scale-[0.98]',
    'disabled:opacity-45 disabled:pointer-events-none disabled:cursor-not-allowed',
    'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#01317b]/20',
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export type BadgeTone =
  | 'neutral'
  | 'navy'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'purple'
  | 'teal'
  | 'castores'
  | 'lobatos'
  | 'rangers'
  | 'pioneros'
  | 'rutas';

export const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200/90',
  navy: 'bg-[#000254] text-white border-[#000254]',
  blue: 'bg-[#01317b]/10 text-[#01317b] border-[#01317b]/20',
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
  amber: 'bg-amber-50 text-amber-900 border-amber-200/90',
  rose: 'bg-rose-50 text-rose-800 border-rose-200/90',
  purple: 'bg-purple-50 text-purple-800 border-purple-200/90',
  teal: 'bg-teal-50 text-teal-800 border-teal-200/90',
  castores: 'bg-orange-50 text-orange-800 border-orange-200/90',
  lobatos: 'bg-amber-50 text-amber-900 border-amber-300/90',
  rangers: 'bg-sky-50 text-sky-800 border-sky-200/90',
  pioneros: 'bg-rose-50 text-rose-800 border-rose-200/90',
  rutas: 'bg-emerald-50 text-emerald-900 border-emerald-200/90',
};

const BRANCH_DOT_COLORS: Record<string, string> = {
  Castores: 'bg-orange-500',
  Lobatos: 'bg-amber-400',
  Rangers: 'bg-sky-600',
  Pioneros: 'bg-[#e22328]',
  Rutas: 'bg-emerald-600',
};

export function getBranchVisualConfig(calculatedBranch: string): {
  name: string;
  tone: BadgeTone;
  dotColor: string;
} {
  const normalized = calculatedBranch.toLowerCase();
  if (normalized.startsWith('castores')) {
    return { name: 'Castores', tone: 'castores', dotColor: BRANCH_DOT_COLORS.Castores };
  }
  if (normalized.startsWith('lobatos')) {
    return { name: 'Lobatos', tone: 'lobatos', dotColor: BRANCH_DOT_COLORS.Lobatos };
  }
  if (normalized.startsWith('rangers')) {
    return { name: 'Rangers', tone: 'rangers', dotColor: BRANCH_DOT_COLORS.Rangers };
  }
  if (normalized.startsWith('pioneros')) {
    return { name: 'Pioneros', tone: 'pioneros', dotColor: BRANCH_DOT_COLORS.Pioneros };
  }
  if (normalized.startsWith('rutas')) {
    return { name: 'Rutas', tone: 'rutas', dotColor: BRANCH_DOT_COLORS.Rutas };
  }
  if (normalized.startsWith('responsables')) {
    return { name: 'Responsables', tone: 'navy', dotColor: 'bg-[#000254]' };
  }
  return { name: calculatedBranch, tone: 'neutral', dotColor: 'bg-slate-400' };
}

export function getStatusVisualConfig(
  status: ApplicationStatus,
  activeTab?: SecretariaTab,
): {
  label: string;
  tone: BadgeTone;
} {
  switch (status) {
    case 'PENDIENTE_REVISION':
      return { label: 'Pendiente de revisión', tone: 'amber' };
    case 'LISTA_ESPERA':
      return { label: 'En lista de espera', tone: 'blue' };
    case 'PLAZA_OFERTADA':
      return { label: 'Plaza ofertada · Enlace activo', tone: 'blue' };
    case 'INSCRIPCION_COMPLETADA':
      return {
        label:
          activeTab === 'OFFERED'
            ? 'Inscripción rellenada · Lista para censar'
            : 'Inscripción completada',
        tone: 'emerald',
      };
    case 'CENSADO':
      return { label: 'Censado oficial', tone: 'emerald' };
    case 'BAJA':
      return { label: 'Baja archivada', tone: 'neutral' };
  }
}

export function secFilterControlClass(extra = ''): string {
  return `w-full h-9 px-3 rounded-xl border border-slate-200/95 bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 hover:border-slate-300 focus:border-[#01317b] focus:ring-3 focus:ring-[#01317b]/12 outline-none transition-all duration-150 ${extra}`;
}
