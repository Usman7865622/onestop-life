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
  const cities = new Set(doctors.flatMap((doctor) => doctor.facilities.map((item) => item.facility.city)));
  const specialities = new Set(doctors.map((doctor) => doctor.speciality));

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <Link className={styles.brand} href="/">OneStop Life</Link>
            <p className={styles.eyebrow}>Doctors · Hospitals · Video visits</p>
            <h1>Find and book trusted doctors near you</h1>
            <p className={styles.heroSub}>Verified specialists with upfront fees, real clinic locations, and easy in-person or video appointments across Pakistan.</p>
            <div className={styles.heroBadges}>
              <span>PMDC-verified profiles</span>
              <span>No hidden booking fee</span>
              <span>Urdu & English support</span>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Doctor network summary">
            <div><strong>{doctors.length || 12}+</strong><span>Verified doctors</span></div>
            <div><strong>{specialities.size || 12}</strong><span>Specialities</span></div>
            <div><strong>{cities.size || 3}</strong><span>Cities covered</span></div>
          </div>
        </header>

        <section className={styles.trustStrip} aria-label="Why patients trust OneStop Life">
          <article><strong>Verified doctors</strong><span>Licence-checked profiles with qualifications shown upfront.</span></article>
          <article><strong>Transparent fees</strong><span>See the consultation fee before you confirm your visit.</span></article>
          <article><strong>Clinic or video</strong><span>Choose a clinic near you or consult from home by video.</span></article>
          <article><strong>Instant booking</strong><span>Request a time in seconds and manage it in My Appointments.</span></article>
        </section>

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
