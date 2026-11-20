import type { ReactNode, SVGProps } from 'react';

type SocialIconProps = SVGProps<SVGSVGElement> & { size?: number };

function BaseSocialIcon({ size = 24, children, ...props }: SocialIconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function InstagramIcon(props: SocialIconProps) {
  return (
    <BaseSocialIcon {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </BaseSocialIcon>
  );
}

export function FacebookIcon(props: SocialIconProps) {
  return (
    <BaseSocialIcon {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </BaseSocialIcon>
  );
}

export function SocialPlatformIcon({
  id,
  ...props
}: SocialIconProps & { id: 'instagram' | 'facebook' }) {
  return id === 'instagram' ? <InstagramIcon {...props} /> : <FacebookIcon {...props} />;
}
