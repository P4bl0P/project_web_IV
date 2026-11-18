import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import {
  BADGE_TONES,
  secButtonClass,
  secFilterControlClass,
  type BadgeTone,
  type ButtonSize,
  type ButtonVariant,
} from './secretariaTokens';

interface SecButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function SecButton({
  variant = 'secondary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...props
}: SecButtonProps) {
  return (
    <button
      type={type}
      className={secButtonClass({ variant, size, className })}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecBadge({
  tone = 'neutral',
  dotColor,
  title,
  className = '',
  children,
}: {
  tone?: BadgeTone;
  dotColor?: string;
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold tracking-tight leading-5 ${BADGE_TONES[tone]} ${className}`}
    >
      {dotColor && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function SecFilterSelect({
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={secFilterControlClass(`cursor-pointer ${className}`)} {...props}>
      {children}
    </select>
  );
}
