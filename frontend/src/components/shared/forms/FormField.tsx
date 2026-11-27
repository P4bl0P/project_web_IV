import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  errorId?: string;
  hint?: string;
  hintId?: string;
  isValid?: boolean;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function FormField({
  label,
  htmlFor,
  required,
  error,
  errorId,
  hint,
  hintId,
  isValid = false,
  badge,
  children,
  className = '',
}: Props) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="inline-flex items-center gap-1 text-xs font-semibold tracking-tight text-slate-700">
          <span>{label}</span>
          {required && (
            <span className="text-rose-600" aria-hidden="true">
              *
            </span>
          )}
        </label>
        <div className="flex items-center gap-1.5">
          {badge}
          {!error && isValid && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 animate-sec-expand"
              aria-hidden="true"
            >
              <CheckCircle2 size={12} className="text-emerald-600" />
            </span>
          )}
        </div>
      </div>
      {hint && (
        <p id={hintId} className="mt-0.5 text-[11px] font-normal text-slate-500">
          {hint}
        </p>
      )}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-[11px] font-medium text-rose-600 animate-sec-expand"
        >
          <AlertCircle size={13} className="mt-[1px] shrink-0 text-rose-600" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
