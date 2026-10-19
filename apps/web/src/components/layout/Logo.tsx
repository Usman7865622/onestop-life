/**
 * OneStop Life — refined brand mark.
 * A calm teal rounded-square with a white cross + life-pulse,
 * echoing care (cross) and vitality (pulse). Works on light/dark.
 */

export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="OneStop Life logo"
    >
      <defs>
        <linearGradient id="osl-logo-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14a098" />
          <stop offset="1" stopColor="#0b5f59" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#osl-logo-bg)" />
      {/* cross */}
      <rect x="21" y="12" width="6" height="24" rx="3" fill="#ffffff" opacity="0.95" />
      <rect x="12" y="21" width="24" height="6" rx="3" fill="#ffffff" opacity="0.95" />
      {/* pulse line across */}
      <path
        d="M8 30h6l2.5-5 3.5 9 2.8-6.5 1.7 2.5H40"
        stroke="#f7b928"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
