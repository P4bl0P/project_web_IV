export function censusInputClass(hasError = false, extra = '') {
  return `w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${
    hasError ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100' : 'border-slate-300'
  } ${extra}`;
}
