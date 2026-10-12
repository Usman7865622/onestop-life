function Star({ filled, size, index }: { filled: boolean; size: number; index: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-hidden={index > 0}
      fill={filled ? '#f59e0b' : 'none'}
      stroke={filled ? '#f59e0b' : '#cbd5e1'}
      strokeWidth="1.6"
      aria-label={index === 0 ? 'star rating' : undefined}
    >
      <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9L12 2.6z" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Read-only star display. `value` may be fractional; rounds to nearest half star
 * visually via full-star threshold. `interactive` turns stars into a picker.
 */
export default function StarRating({
  value,
  size = 16,
  interactive = false,
  onRate,
}: {
  value: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}) {
  if (!interactive) {
    return (
      <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }} aria-label={`Rated ${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} filled={value >= i - 0.25} size={size} index={i} />
        ))}
      </span>
    );
  }

  return (
    <span style={{ display: 'inline-flex', gap: 4 }} role="radiogroup" aria-label="Choose a rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={Math.round(value) === i}
          aria-label={`${i} star${i === 1 ? '' : 's'}`}
          onClick={() => onRate?.(i)}
          style={{
            background: 'none',
            border: 'none',
            padding: 4,
            cursor: 'pointer',
            minWidth: 44,
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Star filled={Math.round(value) >= i} size={size} index={i} />
        </button>
      ))}
    </span>
  );
}
