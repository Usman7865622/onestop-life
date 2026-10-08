import LabsClient from './LabsClient';
import styles from './page.module.css';
import type { LabTest } from '../../lib/health/types';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api-production-7a91a.up.railway.app';

async function getLabTests(): Promise<LabTest[]> {
  try {
    const response = await fetch(`${API_URL}/lab-tests`, { cache: 'no-store' });
    if (!response.ok) return [];
    const payload = (await response.json()) as { items?: LabTest[] } | LabTest[];
    return Array.isArray(payload) ? payload : payload.items ?? [];
  } catch {
    return [];
  }
}

export default async function LabsPage() {
  const tests = await getLabTests();
  const facilities = new Set(tests.map((test) => test.facilityId));
  const cities = new Set(tests.map((test) => test.facility.city));
  const fastest = tests.length ? Math.min(...tests.map((test) => test.reportHours)) : 6;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Lab Tests · Home Sample Collection</p>
            <h1>Lab tests at home, reports without the queues</h1>
            <p className={styles.heroSub}>Book a test online and a trained phlebotomist collects your sample at your doorstep. Digital reports are shared as soon as they are ready — no lab visits, no waiting rooms.</p>
            <div className={styles.heroBadges}>
              <span>Home collection</span>
              <span>Certified labs</span>
              <span>Transparent prices</span>
            </div>
          </div>
          <div className={styles.heroStats} aria-label="Lab service summary">
            <div><strong>{tests.length || 11}+</strong><span>Tests available</span></div>
            <div><strong>{facilities.size || 1}</strong><span>Partner labs</span></div>
            <div><strong>{fastest} hrs</strong><span>Fastest report</span></div>
          </div>
        </header>

        <section className={styles.trustStrip} aria-label="Why book lab tests with OneStop Life">
          <article><strong>Doorstep collection</strong><span>Sample picked up from your home at your chosen time.</span></article>
          <article><strong>Fast digital reports</strong><span>Most reports ready within 6–48 hours, shared instantly.</span></article>
          <article><strong>Upfront pricing</strong><span>The price you see is the price you pay. No surprises.</span></article>
          <article><strong>Hygienic & safe</strong><span>Sealed single-use kits and trained collection staff.</span></article>
        </section>

        {cities.size ? <p className={styles.cityNote}>Now collecting samples in {Array.from(cities).join(', ')} — more cities coming soon.</p> : null}

        <LabsClient tests={tests} />
      </div>
    </main>
  );
}
