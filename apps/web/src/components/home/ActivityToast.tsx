'use client';

import { useEffect, useState } from 'react';
import styles from './ActivityToast.module.css';

type LatestReview = {
  rating: number;
  comment?: string | null;
  createdAt: string;
  user: { name: string | null };
  doctorProfile: { speciality: string; user: { name: string | null } };
};

type ToastMessage = { lead: string; body: string };

/** Service facts that are true of the platform itself — no invented people or events. */
const SERVICE_FACTS: ToastMessage[] = [
  { lead: 'Pharmacist-checked', body: 'every prescription order is verified before dispatch' },
  { lead: 'PMDC-verified doctors', body: 'licences checked before any doctor is listed' },
  { lead: 'Cash on delivery', body: 'available across Pakistan, with free delivery over Rs. 3,000' },
];

function firstName(name: string | null | undefined): string {
  return (name ?? '').trim().split(/\s+/)[0] || 'A patient';
}

function reviewToasts(reviews: LatestReview[]): ToastMessage[] {
  return reviews.slice(0, 3).map((r) => {
    const doctorRaw = r.doctorProfile?.user?.name ?? 'their doctor';
    const doctor = doctorRaw.startsWith('Dr') ? doctorRaw : `Dr. ${doctorRaw}`;
    const stars = '★★★★★'.slice(0, Math.max(1, Math.min(5, Math.round(r.rating))));
    const quote = r.comment ? ` “${r.comment.length > 64 ? `${r.comment.slice(0, 64)}…` : r.comment}”` : '';
    return {
      lead: `${stars} Verified review`,
      body: `${firstName(r.user?.name)} saw ${doctor}${quote}`,
    };
  });
}

async function loadMessages(): Promise<ToastMessage[]> {
  const messages: ToastMessage[] = [];
  try {
    const [doctorsRes, productsRes, facilitiesRes, reviewsRes] = await Promise.all([
      fetch('/api/doctors'),
      fetch('/api/products'),
      fetch('/api/facilities'),
      fetch('/api/reviews/latest'),
    ]);
    const doctors = doctorsRes.ok ? ((await doctorsRes.json()) as { items?: unknown[] }) : null;
    const products = productsRes.ok ? ((await productsRes.json()) as { items?: unknown[] }) : null;
    const facilities = facilitiesRes.ok
      ? ((await facilitiesRes.json()) as { items?: Array<{ city?: string }> })
      : null;
    if (reviewsRes.ok) {
      const reviews = (await reviewsRes.json()) as { items?: LatestReview[] };
      if (reviews.items?.length) messages.push(...reviewToasts(reviews.items));
    }
    const statParts: string[] = [];
    if (doctors?.items?.length) statParts.push(`${doctors.items.length} verified doctors`);
    if (products?.items?.length) statParts.push(`${products.items.length} products in store`);
    if (facilities?.items?.length) {
      const cities = new Set(facilities.items.map((f) => f.city).filter(Boolean));
      statParts.push(`${facilities.items.length} clinics, hospitals & labs${cities.size ? ` in ${cities.size} cities` : ''}`);
    }
    if (statParts.length) messages.push({ lead: 'Live on OneStop', body: statParts.join(' · ') });
  } catch {
    /* fall through to service facts */
  }
  return [...messages, ...SERVICE_FACTS];
}

/**
 * Trust toasts: cycles through real platform data — the latest verified
 * patient reviews when they exist, live catalogue counts, and true service
 * facts. Nothing here is invented: no fake names, orders or timestamps.
 * Pauses for reduced-motion users (CSS hides it entirely).
 */
export default function ActivityToast() {
  const [messages, setMessages] = useState<ToastMessage[]>(SERVICE_FACTS);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadMessages().then((loaded) => {
      if (!cancelled && loaded.length) setMessages(loaded);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let showTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;
    let cycleTimer: ReturnType<typeof setInterval>;
    let current = 0;

    const show = () => {
      setIndex(current % messages.length);
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
  }, [messages]);

  const message = messages[index];
  if (!message) return null;

  return (
    <div
      className={`${styles.toast} ${visible ? styles.show : ''}`}
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
    >
      <span className={styles.pulse} aria-hidden="true" />
      <span className={styles.text}>
        <strong>{message.lead}</strong> · {message.body}
      </span>
    </div>
  );
}
