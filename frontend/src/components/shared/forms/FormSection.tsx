import type { ReactNode } from 'react';

interface Props {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function FormSection({ title, description, children, className = '' }: Props) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/85 bg-white p-5 sm:p-6 shadow-[0_2px_10px_-3px_rgba(12,25,51,0.04)] space-y-4 ${className}`}
    >
      {(title || description) && (
        <header className="pb-1 border-b border-slate-100">
          {title && <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#0c1933]">{title}</h2>}
          {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
        </header>
      )}
      {children}
    </section>
  );
}
