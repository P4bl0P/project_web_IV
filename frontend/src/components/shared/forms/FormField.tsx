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
      <label className="block text-xs font-semibold tracking-tight text-slate-700">
        {label} {required && <span className="text-rose-600" aria-hidden="true">*</span>}
      </label>
      {hint && <p className="mt-0.5 text-[11px] font-normal text-slate-500">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-[11px] font-medium text-rose-600">{error}</p>}
    </div>
  );
}
