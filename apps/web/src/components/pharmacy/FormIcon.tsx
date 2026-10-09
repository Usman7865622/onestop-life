type FormIconProps = {
  form?: string | null;
  size?: number;
};

/** Small stroke-style SVG icons per medicine form (Tablet, Syrup, Capsule, Cream, Drops, Inhaler, Injection, Sachet). */
export default function FormIcon({ form, size = 26 }: FormIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch ((form ?? '').toLowerCase()) {
    case 'capsule':
      return (
        <svg {...common}>
          <rect x="3.2" y="8.6" width="17.6" height="6.8" rx="3.4" transform="rotate(-35 12 12)" />
          <path d="M8.5 9.2l5.3 7.4" />
        </svg>
      );
    case 'syrup':
      return (
        <svg {...common}>
          <path d="M10 3h4M10.8 3v3L9.5 8.5V19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V8.5L13.2 6V3" />
          <path d="M9.5 13h5" />
        </svg>
      );
    case 'cream':
      return (
        <svg {...common}>
          <path d="M8 3.5h8M9 3.5V6l-1.2 2.2V19a1.8 1.8 0 0 0 1.8 1.8h4.8A1.8 1.8 0 0 0 16.2 19V8.2L15 6V3.5" />
          <path d="M9.8 13.5h4.4" />
        </svg>
      );
    case 'drops':
      return (
        <svg {...common}>
          <path d="M12 3.6c2.8 3.3 5 5.9 5 9a5 5 0 1 1-10 0c0-3.1 2.2-5.7 5-9z" />
          <path d="M9.6 13.2a2.6 2.6 0 0 0 2 3.2" />
        </svg>
      );
    case 'inhaler':
      return (
        <svg {...common}>
          <path d="M10 3.5h5v4h-5zM12.5 7.5V15a3.5 3.5 0 0 0 3.5 3.5h3.5" />
          <path d="M6.5 20.5h8" />
          <path d="M8 15.5c-1.8.6-3 1.6-3 3v2h3.5" />
        </svg>
      );
    case 'injection':
      return (
        <svg {...common}>
          <path d="M4 20l3.2-1L6 17.8 4 20zM7 17l7.8-7.8M14.8 9.2l-2-2L17 3l4 4-4.2 4.2M13.5 5.3l5.2 5.2M9.8 11.2l3 3" />
        </svg>
      );
    case 'sachet':
      return (
        <svg {...common}>
          <path d="M7 3.5h10V20a.8.8 0 0 1-.8.8H7.8A.8.8 0 0 1 7 20V3.5z" />
          <path d="M7 7h10M9.8 12h4.4M9.8 15.5h4.4" />
        </svg>
      );
    case 'tablet':
    default:
      return (
        <svg {...common}>
          <circle cx="9" cy="15" r="5.2" />
          <path d="M5.4 11.4l7.2 7.2M15.8 4.6l3.6 3.6a2 2 0 0 1 0 2.9l-1.2 1.2a2 2 0 0 1-2.9 0l-3.6-3.6a2 2 0 0 1 0-2.9l1.2-1.2a2 2 0 0 1 2.9 0z" />
        </svg>
      );
  }
}
