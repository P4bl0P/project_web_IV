import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  tone?: 'error' | 'info' | 'success';
  className?: string;
}

const tones = {
  error: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-blue-100 bg-blue-50 text-blue-900',
  success: 'border-emerald-100 bg-emerald-50 text-emerald-800',
};

export default function FormAlert({ children, tone = 'error', className = '' }: Props) {
  return (
    <div role={tone === 'error' ? 'alert' : undefined} className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-xs sm:text-sm ${tones[tone]} ${className}`}>
      {tone === 'error' && <AlertCircle size={20} className="mt-0.5 shrink-0" />}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
