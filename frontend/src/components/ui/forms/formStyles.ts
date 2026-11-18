export function formInputClass(hasError = false, extra = '') {
  return `w-full rounded-xl border px-3.5 py-2.5 text-sm transition outline-none ${
    hasError
      ? 'border-red-500 bg-red-50/40 focus:border-red-600 focus:ring-4 focus:ring-red-100'
      : 'border-slate-300 bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100'
  } ${extra}`;
}

export const formCheckboxClass = 'mt-0.5 h-4 w-4 rounded text-indigo-600';
