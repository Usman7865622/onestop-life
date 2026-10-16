'use client';

import styles from './Ticker.module.css';

const ITEMS = [
  'Cash on Delivery',
  'Free delivery over Rs. 3,000',
  'Verified doctors',
  'Genuine medicines',
  'Prescription verified by pharmacists',
  'DRAP-licensed partner pharmacies',
  'PMDC-verified credentials',
  '24/7 emergency support',
];

/**
 * Infinite scrolling trust ticker. Duplicates the list for a seamless loop.
 * Pauses on hover. Respects prefers-reduced-motion.
 */
export default function Ticker() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className={styles.ticker} aria-label="Why shoppers trust OneStop Life">
      <div className={styles.track}>
        {row.map((item, i) => (
          <span key={i} className={styles.item} aria-hidden={i >= ITEMS.length}>
            <span className={styles.dot} aria-hidden="true" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
