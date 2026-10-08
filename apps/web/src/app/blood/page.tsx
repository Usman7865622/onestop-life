import BloodClient from './BloodClient';
import styles from './page.module.css';
import type { Facility } from '../../lib/doctors/types';
import type { PublicBloodRequest } from '../../lib/health/types';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api-production-7a91a.up.railway.app';

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export default async function BloodPage() {
  const [banksPayload, requestsPayload] = await Promise.all([
    getJson<{ items?: Facility[] } | Facility[]>('/blood-banks'),
    getJson<{ items?: PublicBloodRequest[] }>('/blood-requests'),
  ]);
  const banks = Array.isArray(banksPayload) ? banksPayload : banksPayload?.items ?? [];
  const requests = requestsPayload?.items ?? [];
  const cities = new Set(banks.map((bank) => bank.city));
  const unitsNeeded = requests.reduce((sum, request) => sum + request.units, 0);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Blood Banks · Donor Requests</p>
            <h1>Find blood, save lives</h1>
            <p className={styles.heroSub}>Connect with verified blood banks in your city and see urgent donor requests near you. One unit of blood can save up to three lives — your request reaches the community instantly.</p>
            <div className={styles.heroBadges}>
              <span>Verified blood banks</span>
              <span>Urgent requests board</span>
              <span>24/7 emergency banks</span>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Blood service summary">
            <div><strong>{banks.length || 2}</strong><span>Blood banks</span></div>
            <div><strong>{cities.size || 2}</strong><span>Cities covered</span></div>
            <div><strong>{unitsNeeded}</strong><span>Units needed now</span></div>
          </div>
        </header>

        <section className={styles.trustStrip} aria-label="How blood requests work">
          <article><strong>Post a request</strong><span>Tell us the blood group, units and hospital — it appears on the board instantly.</span></article>
          <article><strong>Donors respond</strong><span>Community donors and banks see your request and can contact you directly.</span></article>
          <article><strong>Verified banks</strong><span>Listed blood banks are screened facilities with 24/7 emergency service.</span></article>
          <article><strong>Privacy first</strong><span>Your phone number is never shown publicly — only to coordinate your own requests.</span></article>
        </section>

        <BloodClient banks={banks} initialRequests={requests} />
      </div>
    </main>
  );
}
