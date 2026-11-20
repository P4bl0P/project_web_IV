export function formInputClass(hasError = false, extra = '') {
  return `w-full min-h-[40px] rounded-xl border px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150 outline-none ${
    hasError
      ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600 focus:ring-3 focus:ring-rose-500/15'
      : 'border-slate-200/95 bg-white hover:border-slate-300 focus:border-[#01317b] focus:ring-3 focus:ring-[#01317b]/12'
  } ${extra}`;
}

export const formCheckboxClass =
  'mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#01317b] accent-[#01317b] focus:ring-2 focus:ring-[#01317b]/20 cursor-pointer';

