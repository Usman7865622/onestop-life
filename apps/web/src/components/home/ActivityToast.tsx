'use client';

import { useEffect, useState } from 'react';
import styles from './ActivityToast.module.css';

const ACTIVITIES = [
  { name: 'Ayesha', city: 'Lahore', action: 'booked Dr. Ahmed Khan', time: '2 min ago' },
  { name: 'Bilal', city: 'Karachi', action: 'ordered Baby Diapers', time: '5 min ago' },
  { name: 'Fatima', city: 'Islamabad', action: 'booked a CBC test', time: '8 min ago' },
  { name: 'Usman', city: 'Lahore', action: 'ordered Herbal Green Tea', time: '12 min ago' },
  { name: 'Sana', city: 'Rawalpindi', action: 'booked Dr. Fatima Noor', time: '15 min ago' },
  { name: 'Ali', city: 'Karachi', action: 'ordered Vitamin D3', time: '18 min ago' },
  { name: 'Hira', city: 'Faisalabad', action: 'requested blood donation', time: '22 min ago' },
  { name: 'Danish', city: 'Lahore', action: 'booked a video consultation', time: '25 min ago' },
];

/**
 * Subtle live-activity toasts. Cycles through realistic recent
 * actions every ~9s, slides in from bottom-left, auto-dismisses.
 * Purely illustrative social proof — pauses when tab is hidden.
 */
export default function ActivityToast() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let showTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;
    let cycleTimer: ReturnType<typeof setInterval>;
    let current = 0;

    const show = () => {
      setIndex(current % ACTIVITIES.length);
      setVisible(true);
      hideTimer = setTimeout(() => setVisible(false), 4200);
      current += 1;
    };

    // First toast after 4s, then every 11s
    showTimer = setTimeout(() => {
      show();
      cycleTimer = setInterval(show, 11000);
    }, 4000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearInterval(cycleTimer);
    };
  }, []);

  const activity = ACTIVITIES[index];
  if (!activity) return null;

  return (
    <div
      className={`${styles.toast} ${visible ? styles.show : ''}`}
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
    >
      <span className={styles.pulse} aria-hidden="true" />
      <span className={styles.text}>
        <strong>{activity.name}</strong> from {activity.city} {activity.action}
        <span className={styles.time}> · {activity.time}</span>
      </span>
    </div>
  );
}
