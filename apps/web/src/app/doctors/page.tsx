import Link from 'next/link';
import DoctorsClient from './DoctorsClient';
import styles from './page.module.css';
import type { Doctor } from '../../lib/doctors/types';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api-production-7a91a.up.railway.app';

async function getDoctors(): Promise<Doctor[]> {
  try {
    const response = await fetch(`${API_URL}/doctors`, { cache: 'no-store' });
    if (!response.ok) return [];
    const payload = (await response.json()) as { items?: Doctor[] };
    return payload.items ?? [];
  } catch {
    return [];
  }
}

export default async function DoctorsPage() {
  const doctors = await getDoctors();

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <Link className={styles.backLink} href="/">OneStop Life</Link>
            <p className={styles.kicker}>Verified doctors</p>
            <h1>Book a doctor you can trust.</h1>
            <p className={styles.subtitle}>PMDC-verified doctors with upfront fees, real clinic locations, and instant booking — in-person or by video.</p>
          </div>
          <span className={styles.count}>{doctors.length} doctors</span>
        </header>
        <div className={styles.trustBar}>
          <span>✓ Verified licence</span><span>Rs. fee shown upfront</span><span>Free reschedule support</span><span>Urdu & English</span>
        </div>
        {doctors.length ? (
          <DoctorsClient doctors={doctors} />
        ) : (
          <section className={styles.emptyState}>
            <div className={styles.emptyIcon}>+</div>
            <h2>No doctors available yet</h2>
            <p>Verified doctors will appear here once their profiles are approved. Please check back shortly.</p>
            <Link className={styles.homeLink} href="/">Back to home</Link>
          </section>
        )}
      </div>
    </main>
  );
}
