import type { ReactNode } from 'react';

interface Props {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export default function FormField({ label, required, error, hint, children, className = '' }: Props) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-red-600" aria-hidden="true">*</span>}
      </label>
      {hint && <p className="mt-0.5 text-[11px] font-normal text-slate-500">{hint}</p>}
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
