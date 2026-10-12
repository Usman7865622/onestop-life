'use client';

type VerifiedShieldProps = {
  size?: number;
  className?: string;
  label?: string;
};

/**
 * Small shield-check icon in accent green used wherever OneStop shows
 * a "Verified" mark. Decorative; the adjacent text carries the meaning.
 */
export default function VerifiedShield({ size = 16, className, label = 'Verified' }: VerifiedShieldProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label={label}
    >
      <path
        d="M12 2.5 4.5 5.6v5.6c0 4.9 3.2 8.5 7.5 10.3 4.3-1.8 7.5-5.4 7.5-10.3V5.6L12 2.5Z"
        fill="#dcfce7"
        stroke="#15803d"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m8.6 12.1 2.4 2.4 4.4-4.7"
        stroke="#15803d"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
