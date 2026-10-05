import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function BaseIcon({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...STROKE} {...props}>
      {children}
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.8 7 7.1 5a2 2 0 0 0 2.2 0l7.1-5" />
    </BaseIcon>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
      <path d="M8 10.5V7.8A4 4 0 0 1 16 7.8v2.7" />
      <path d="M12 14.6v2.2" />
    </BaseIcon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8.4" r="3.6" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </BaseIcon>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6.4 3.6h3l1.5 3.8-2 1.4a11.4 11.4 0 0 0 5.3 5.3l1.4-2 3.8 1.5v3a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 4.4 5.8a2 2 0 0 1 2-2.2Z" />
    </BaseIcon>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M2.6 12S6 5.8 12 5.8 21.4 12 21.4 12 18 18.2 12 18.2 2.6 12 2.6 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </BaseIcon>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 4.6 20 19.4" />
      <path d="M9.6 7.2A9.6 9.6 0 0 1 12 6.9c6 0 9.4 5.1 9.4 5.1a15 15 0 0 1-2.6 3.1" />
      <path d="M6.6 9A15.2 15.2 0 0 0 2.6 12s3.4 5.1 9.4 5.1a9.2 9.2 0 0 0 3.2-.6" />
      <path d="M10.3 10.4a2.8 2.8 0 0 0 3.5 3.4" />
    </BaseIcon>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m8.4 12.3 2.4 2.4 4.8-5" />
    </BaseIcon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.8v5" />
      <path d="M12 16.1h.01" />
    </BaseIcon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4.5 12h14" />
      <path d="m13 6.5 5.5 5.5L13 17.5" />
    </BaseIcon>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3.4 5 6v5.4c0 4.1 2.9 7.7 7 9.2 4.1-1.5 7-5.1 7-9.2V6Z" />
      <path d="m9 12 2.2 2.2L15.4 10" />
    </BaseIcon>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M2.8 6.4h10.4v9.2H2.8z" />
      <path d="M13.2 9.6h3.6l3.4 3v3H13.2z" />
      <circle cx="7" cy="17.6" r="1.7" />
      <circle cx="16.8" cy="17.6" r="1.7" />
    </BaseIcon>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M11.4 3.6H20v8.6l-8.6 8.6-8.4-8.4Z" />
      <circle cx="16.2" cy="7.8" r="1.4" />
    </BaseIcon>
  );
}

export function HeadsetIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4.4 14v-2a7.6 7.6 0 0 1 15.2 0v2" />
      <path d="M4.4 13.4h1.8v5H5.6a1.2 1.2 0 0 1-1.2-1.2Z" />
      <path d="M19.6 13.4h-1.8v5h.6a1.2 1.2 0 0 0 1.2-1.2Z" />
      <path d="M19.6 17.4v.6a2.6 2.6 0 0 1-2.6 2.6h-2.4" />
    </BaseIcon>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="8.2" cy="15.8" r="3.6" />
      <path d="m10.8 13.2 7-7" />
      <path d="m15.4 8.6 2 2" />
      <path d="m17.6 6.4 2 2" />
    </BaseIcon>
  );
}
