'use client';

import styles from './skeletons.module.css';

export function CardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={`${styles.bar} ${styles.barImage}`} />
      <div className={`${styles.bar} ${styles.barTitle}`} />
      <div className={`${styles.bar} ${styles.barLine}`} />
      <div className={`${styles.bar} ${styles.barShort}`} />
      <div className={styles.barRow}>
        <div className={`${styles.bar} ${styles.barPrice}`} />
        <div className={`${styles.bar} ${styles.barButton}`} />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={styles.grid} role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}
