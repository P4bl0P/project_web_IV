import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  tone?: 'error' | 'info' | 'success';
  className?: string;
}

const tones = {
  error: 'border-rose-200/90 bg-rose-50/90 text-rose-800',
  info: 'border-[#01317b]/20 bg-[#01317b]/5 text-[#000254]',
  success: 'border-emerald-200/90 bg-emerald-50/90 text-emerald-800',
};

export default function FormAlert({ children, tone = 'error', className = '' }: Props) {
  return (
    <div
      role={tone === 'error' ? 'alert' : undefined}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-xs sm:text-sm ${tones[tone]} ${className}`}
    >
      {tone === 'error' && <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
