import type { ReactNode } from 'react';

interface Props {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function FormSection({ title, description, children, className = '' }: Props) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs ${className}`}>
      {(title || description) && (
        <header className="mb-4">
          {title && <h2 className="text-lg font-bold text-slate-800">{title}</h2>}
          {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
        </header>
      )}
      {children}
    </section>
  );
}
